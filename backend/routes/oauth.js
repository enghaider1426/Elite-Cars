/**
 * OAuth Routes - Google and Apple Sign-In
 * Secure authorization-code / identity-token verification.
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite:
    process.env.NODE_ENV === 'production'
      ? 'none'
      : 'lax',
  maxAge: 10 * 60 * 1000,
  path: '/',
});

const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite:
    process.env.COOKIE_SAMESITE ||
    (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: '/',
});

const safeDecodeURIComponent = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseCookies = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        const index = value.indexOf('=');

        return index === -1
          ? [safeDecodeURIComponent(value), '']
          : [
              safeDecodeURIComponent(value.slice(0, index)),
              safeDecodeURIComponent(value.slice(index + 1)),
            ];
      })
  );

const isGoogleConfigured = () =>
  !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );

const isAppleConfigured = () => !!process.env.APPLE_CLIENT_ID;

const issueSession = (res, user) => {
  const token = user.getSignedJwtToken();
  res.cookie('auth_token', token, authCookieOptions());
};

const base64urlToBuffer = (value) =>
  Buffer.from(value, 'base64url');

const parseJwt = (token) => {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid JWT');
  }

  return {
    header: JSON.parse(
      base64urlToBuffer(parts[0]).toString('utf8')
    ),
    payload: JSON.parse(
      base64urlToBuffer(parts[1]).toString('utf8')
    ),
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: base64urlToBuffer(parts[2]),
  };
};

const jwkToPublicKey = (jwk) =>
  crypto.createPublicKey({
    key: jwk,
    format: 'jwk',
  });

const verifyRs256Jwt = (token, jwk) => {
  const {
    header,
    payload,
    signingInput,
    signature,
  } = parseJwt(token);

  if (header.alg !== 'RS256') {
    throw new Error('Unsupported JWT algorithm');
  }

  const valid = crypto.verify(
    'RSA-SHA256',
    Buffer.from(signingInput),
    jwkToPublicKey(jwk),
    signature
  );

  if (!valid) {
    throw new Error('Invalid JWT signature');
  }

  return payload;
};

let googleKeysCache = {
  expiresAt: 0,
  keys: [],
};

let appleKeysCache = {
  expiresAt: 0,
  keys: [],
};

const fetchJwks = async (url, cache) => {
  if (cache.expiresAt > Date.now() && cache.keys.length) {
    return cache.keys;
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      'Unable to fetch identity provider keys'
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.keys) || !data.keys.length) {
    throw new Error(
      'No identity provider keys'
    );
  }

  cache.keys = data.keys;
  cache.expiresAt = Date.now() + 60 * 60 * 1000;

  return cache.keys;
};

const validateCommonClaims = (
  payload,
  issuer,
  audience
) => {
  const now = Math.floor(Date.now() / 1000);

  if (payload.iss !== issuer) {
    throw new Error('Invalid issuer');
  }

  const audOk = Array.isArray(payload.aud)
    ? payload.aud.includes(audience)
    : payload.aud === audience;

  if (!audOk) {
    throw new Error('Invalid audience');
  }

  if (
    !payload.sub ||
    typeof payload.sub !== 'string'
  ) {
    throw new Error('Missing subject');
  }

  if (!payload.exp || payload.exp <= now) {
    throw new Error('Expired identity token');
  }

  if (payload.iat && payload.iat > now + 60) {
    throw new Error('Invalid issued-at time');
  }
};

/**
 * GOOGLE LOGIN
 */
router.get(
  '/google',
  asyncHandler(async (req, res) => {
    if (!isGoogleConfigured()) {
      throw new ErrorResponse(
        'خدمة تسجيل الدخول بجوجل غير مضبوطة بعد',
        501
      );
    }

    const state = crypto
      .randomBytes(32)
      .toString('hex');

    res.cookie(
      'google_oauth_state',
      state,
      cookieOptions()
    );

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });

    res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  })
);

/**
 * GOOGLE CALLBACK
 */
router.get(
  '/google/callback',
  asyncHandler(async (req, res) => {
    if (!isGoogleConfigured()) {
      throw new ErrorResponse(
        'خدمة تسجيل الدخول بجوجل غير مضبوطة بعد',
        501
      );
    }

    const {
      code,
      error,
      state,
    } = req.query;

    const cookies = parseCookies(
      req.headers.cookie
    );

    if (error) {
      console.error(
        'Google OAuth returned error:',
        String(error)
      );

      throw new ErrorResponse(
        'تم إلغاء تسجيل الدخول بجوجل',
        400
      );
    }

    if (
      !code ||
      typeof code !== 'string'
    ) {
      throw new ErrorResponse(
        'رمز التفويض مفقود',
        400
      );
    }

    if (
      !state ||
      !cookies.google_oauth_state ||
      state.length !==
        cookies.google_oauth_state.length ||
      !crypto.timingSafeEqual(
        Buffer.from(state),
        Buffer.from(cookies.google_oauth_state)
      )
    ) {
      throw new ErrorResponse(
        'جلسة OAuth غير صالحة',
        401
      );
    }

    res.clearCookie(
      'google_oauth_state',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite:
          process.env.NODE_ENV ===
          'production'
            ? 'none'
            : 'lax',
        path: '/',
      }
    );

    /**
     * Exchange Google authorization code
     * for Google tokens.
     */
    let tokenResponse;

    try {
      tokenResponse = await fetch(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            code,
            client_id:
              process.env.GOOGLE_CLIENT_ID,
            client_secret:
              process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri:
              process.env.GOOGLE_REDIRECT_URI,
            grant_type:
              'authorization_code',
          }).toString(),
        }
      );
    } catch (error) {
      console.error(
        'Google token request failed:',
        error?.message || error
      );

      throw new ErrorResponse(
        'تعذر الاتصال بخدمة جوجل',
        502
      );
    }

    let tokenData = {};

    try {
      tokenData =
        await tokenResponse.json();
    } catch (error) {
      console.error(
        'Google token response JSON parse failed:',
        error?.message || error
      );
    }

    /**
     * IMPORTANT:
     * Do not log client_secret or authorization code.
     * Only log safe Google response information.
     */
    if (!tokenResponse.ok) {
      console.error(
        'Google token exchange failed:',
        {
          status: tokenResponse.status,
          error:
            tokenData?.error || null,
          error_description:
            tokenData?.error_description ||
            null,
        }
      );

      throw new ErrorResponse(
        'فشل في الحصول على رمز جوجل',
        502
      );
    }

    if (!tokenData.id_token) {
      console.error(
        'Google token exchange succeeded but id_token is missing:',
        {
          status: tokenResponse.status,
          token_type:
            tokenData?.token_type || null,
          scope:
            tokenData?.scope || null,
        }
      );

      throw new ErrorResponse(
        'فشل في الحصول على رمز جوجل',
        502
      );
    }

    let payload;

    try {
      const parsed =
        parseJwt(tokenData.id_token);

      const keys = await fetchJwks(
        'https://www.googleapis.com/oauth2/v3/certs',
        googleKeysCache
      );

      const key = keys.find(
        (k) => k.kid === parsed.header.kid
      );

      if (!key) {
        throw new Error(
          'Unknown Google signing key'
        );
      }

      payload = verifyRs256Jwt(
        tokenData.id_token,
        key
      );

      validateCommonClaims(
        payload,
        'https://accounts.google.com',
        process.env.GOOGLE_CLIENT_ID
      );

      if (
        payload.email_verified !== true
      ) {
        throw new Error(
          'Google email is not verified'
        );
      }
    } catch (error) {
      console.error(
        'Google identity verification failed:',
        error?.message || error
      );

      throw new ErrorResponse(
        'تعذر التحقق من هوية حساب جوجل',
        401
      );
    }

    if (
      !payload.email ||
      typeof payload.email !== 'string'
    ) {
      throw new ErrorResponse(
        'لم يتم العثور على بريد إلكتروني في حساب جوجل',
        502
      );
    }

    const email = payload.email
      .toLowerCase()
      .trim();

    let user =
      await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: (
          payload.name ||
          'مستخدم جوجل'
        ).slice(0, 50),

        email,

        password:
          crypto
            .randomBytes(32)
            .toString('hex'),

        avatar:
          payload.picture || '',

        emailVerified: true,
      });
    } else if (!user.emailVerified) {
      user.emailVerified = true;

      await user.save({
        validateBeforeSave: false,
      });
    }

    if (!user.isActive) {
      throw new ErrorResponse(
        'الحساب معطل - يرجى التواصل مع الإدارة',
        401
      );
    }

    issueSession(res, user);

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CORS_ORIGIN
        ?.split(',')[0]
        .trim() ||
      'http://localhost:5173';

    res.redirect(
      `${frontendUrl}/auth/callback`
    );
  })
);

/**
 * APPLE LOGIN
 */
router.post(
  '/apple',
  asyncHandler(async (req, res) => {
    if (!isAppleConfigured()) {
      throw new ErrorResponse(
        'خدمة تسجيل الدخول بأبل غير مضبوطة بعد',
        501
      );
    }

    const {
      identityToken,
      user: appleUser,
    } = req.body;

    if (
      !identityToken ||
      typeof identityToken !== 'string'
    ) {
      throw new ErrorResponse(
        'رمز هوية أبل مفقود',
        400
      );
    }

    let payload;

    try {
      const parsed =
        parseJwt(identityToken);

      const keys = await fetchJwks(
        'https://appleid.apple.com/auth/keys',
        appleKeysCache
      );

      const key = keys.find(
        (k) => k.kid === parsed.header.kid
      );

      if (!key) {
        throw new Error(
          'Unknown Apple signing key'
        );
      }

      payload = verifyRs256Jwt(
        identityToken,
        key
      );

      validateCommonClaims(
        payload,
        'https://appleid.apple.com',
        process.env.APPLE_CLIENT_ID
      );
    } catch (error) {
      console.error(
        'Apple identity verification failed:',
        error?.message || error
      );

      throw new ErrorResponse(
        'تعذر التحقق من هوية حساب أبل',
        401
      );
    }

    const appleEmail =
      payload.email;

    if (!appleEmail) {
      throw new ErrorResponse(
        'لم يتم العثور على بريد إلكتروني في حساب أبل',
        502
      );
    }

    const email = appleEmail
      .toLowerCase()
      .trim();

    let user =
      await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: appleUser?.name
          ? String(
              appleUser.name
            ).slice(0, 50)
          : 'مستخدم أبل',

        email,

        password:
          crypto
            .randomBytes(32)
            .toString('hex'),

        emailVerified: true,
      });
    } else if (!user.emailVerified) {
      user.emailVerified = true;

      await user.save({
        validateBeforeSave: false,
      });
    }

    if (!user.isActive) {
      throw new ErrorResponse(
        'الحساب معطل - يرجى التواصل مع الإدارة',
        401
      );
    }

    issueSession(res, user);

    res.json({
      success: true,
      message:
        'تم تسجيل الدخول بحساب أبل بنجاح',
    });
  })
);

module.exports = router;