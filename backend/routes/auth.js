const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const Car = require('../models/Car');

const { protect, admin } = require('../middleware/auth');
const {
  asyncHandler,
  ErrorResponse,
} = require('../middleware/errorHandler');

const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite:
    process.env.COOKIE_SAMESITE ||
    (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: '/',
});

const setAuthCookie = (res, token) =>
  res.cookie('auth_token', token, authCookieOptions());

const clearAuthCookie = (res) =>
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite:
      process.env.COOKIE_SAMESITE ||
      (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    path: '/',
  });

const AZ_PHONE_REGEX = /^\+?994\d{9}$/;

/*
 * =========================================================
 * Gmail SMTP Email Service
 * =========================================================
 *
 * يستخدم Gmail SMTP لإرسال رسائل التحقق واستعادة كلمة المرور.
 * لا يحتاج إلى شراء دومين.
 */

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      'SMTP_USER أو SMTP_PASS غير موجود في متغيرات البيئة'
    );
  }
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,

  // Force IPv4 to avoid Render IPv6 connection issues
  family: 4,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

  const from =
    process.env.SMTP_FROM ||
    `Elite Cars <${process.env.SMTP_USER}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(
      'Email sent successfully:',
      info.messageId
    );
  }

  return info;
};

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ErrorResponse('الاسم مطلوب', 400);
    }

    if (!email || typeof email !== 'string') {
      throw new ErrorResponse(
        'البريد الإلكتروني مطلوب',
        400
      );
    }

    if (!password || typeof password !== 'string') {
      throw new ErrorResponse(
        'كلمة المرور مطلوبة',
        400
      );
    }

    if (password.length < 6) {
      throw new ErrorResponse(
        'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        400
      );
    }

    if (password.length > 128) {
      throw new ErrorResponse(
        'كلمة المرور لا يمكن أن تتجاوز 128 حرفاً',
        400
      );
    }

    if (phone && !AZ_PHONE_REGEX.test(phone.trim())) {
      throw new ErrorResponse(
        'رقم الهاتف يجب أن يكون رقم أذربيجاني صالحاً',
        400
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      throw new ErrorResponse(
        'البريد الإلكتروني مستخدم بالفعل',
        400
      );
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      ...(phone ? { phone: phone.trim() } : {}),
      emailVerified: false,
    });

    const verificationToken =
      user.getEmailVerificationToken();

    await user.save();

    if (process.env.NODE_ENV === 'development') {
      console.log(
        'Email verification token generated for:',
        user.email
      );
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      'http://localhost:5173';

    const verificationUrl =
      `${frontendUrl}/verify-email?token=${encodeURIComponent(
        verificationToken
      )}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'تأكيد البريد الإلكتروني - Elite Cars',
        text:
          `مرحباً ${user.name || ''}\n\n` +
          `شكراً لتسجيلك في Elite Cars.\n\n` +
          `اضغط على الرابط التالي لتأكيد بريدك الإلكتروني:\n\n` +
          `${verificationUrl}\n\n` +
          `هذا الرابط صالح لفترة محدودة.`,
        html: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني - Elite Cars</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#0b0b0b;
  font-family:Arial,Helvetica,sans-serif;
  color:#f5f5f5;
">
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#0b0b0b;padding:40px 15px;"
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            background:#151515;
            border:1px solid #2c2c2c;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 15px 45px rgba(0,0,0,0.45);
          "
        >

          <!-- Header -->
          <tr>
            <td
              align="center"
              style="
                padding:32px 25px;
                background:#111111;
                border-bottom:1px solid #2c2c2c;
              "
            >
              <div style="
                font-size:30px;
                font-weight:700;
                letter-spacing:1px;
                color:#ffffff;
              ">
                Elite
                <span style="color:#b8945a;">Cars</span>
              </div>

              <div style="
                margin-top:8px;
                color:#999999;
                font-size:13px;
                letter-spacing:1px;
              ">
                PREMIUM AUTOMOTIVE EXPERIENCE
              </div>
            </td>
          </tr>

          <!-- Gold line -->
          <tr>
            <td style="
              height:3px;
              background:#b8945a;
              font-size:0;
              line-height:0;
            ">
              &nbsp;
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td
              align="center"
              style="padding:42px 35px 35px;"
            >
              <div style="
                width:72px;
                height:72px;
                line-height:72px;
                margin:0 auto 22px;
                border-radius:50%;
                background:rgba(184,148,90,0.12);
                border:1px solid rgba(184,148,90,0.35);
                color:#b8945a;
                font-size:34px;
                font-weight:bold;
              ">
                ✓
              </div>

              <h1 style="
                margin:0 0 18px;
                color:#ffffff;
                font-size:27px;
                font-weight:700;
              ">
                تأكيد البريد الإلكتروني
              </h1>

              <p style="
                margin:0 0 12px;
                color:#e8e8e8;
                font-size:17px;
                line-height:1.9;
              ">
                مرحباً ${user.name || ''}،
              </p>

              <p style="
                margin:0 0 22px;
                color:#bcbcbc;
                font-size:15px;
                line-height:1.9;
              ">
                شكراً لتسجيلك في
                <strong style="color:#b8945a;">
                  Elite Cars
                </strong>.
                لتفعيل حسابك والاستمتاع بخدمات الموقع،
                يرجى تأكيد بريدك الإلكتروني.
              </p>

              <!-- Button -->
              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin:0 auto 25px;"
              >
                <tr>
                  <td
                    align="center"
                    style="
                      border-radius:10px;
                      background:#b8945a;
                    "
                  >
                    <a
                      href="${verificationUrl}"
                      style="
                        display:inline-block;
                        padding:15px 30px;
                        color:#111111;
                        background:#b8945a;
                        text-decoration:none;
                        font-size:16px;
                        font-weight:700;
                        border-radius:10px;
                      "
                    >
                      تأكيد البريد الإلكتروني
                    </a>
                  </td>
                </tr>
              </table>

              <p style="
                margin:0 0 10px;
                color:#999999;
                font-size:13px;
                line-height:1.8;
              ">
                إذا لم يعمل الزر، يمكنك نسخ الرابط التالي إلى المتصفح:
              </p>

              <div style="
                padding:14px;
                background:#0f0f0f;
                border:1px solid #292929;
                border-radius:10px;
                direction:ltr;
                text-align:left;
                word-break:break-all;
              ">
                <a
                  href="${verificationUrl}"
                  style="
                    color:#b8945a;
                    text-decoration:none;
                    font-size:12px;
                  "
                >
                  ${verificationUrl}
                </a>
              </div>

              <p style="
                margin:22px 0 0;
                color:#777777;
                font-size:12px;
                line-height:1.8;
              ">
                هذا الرابط صالح لفترة محدودة.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="
                padding:22px 20px;
                background:#101010;
                border-top:1px solid #252525;
              "
            >
              <div style="
                color:#b8945a;
                font-size:15px;
                font-weight:700;
                margin-bottom:8px;
              ">
                Elite Cars
              </div>

              <div style="
                color:#666666;
                font-size:11px;
                line-height:1.7;
              ">
                رسالتك للتميز تبدأ من هنا
              </div>

              <div style="
                color:#555555;
                font-size:10px;
                margin-top:8px;
              ">
                © Elite Cars. جميع الحقوق محفوظة.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`,
      });
    } catch (emailError) {
      await User.deleteOne({
        _id: user._id,
      });

      console.error(
        'Email verification error:',
        emailError.message
      );

      throw new ErrorResponse(
        'تعذر إرسال رسالة تأكيد البريد الإلكتروني، يرجى المحاولة لاحقاً',
        500
      );
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message:
        'تم إنشاء الحساب. يرجى تأكيد بريدك الإلكتروني',
      user: userResponse,
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string') {
      throw new ErrorResponse(
        'البريد الإلكتروني مطلوب',
        400
      );
    }

    if (!password || typeof password !== 'string') {
      throw new ErrorResponse(
        'كلمة المرور مطلوبة',
        400
      );
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select('+password');

    if (!user) {
      throw new ErrorResponse(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        401
      );
    }

    if (user.isActive === false) {
      throw new ErrorResponse(
        'هذا الحساب غير مفعل',
        403
      );
    }

    const isMatch =
      await user.comparePassword(password);

    if (!isMatch) {
      throw new ErrorResponse(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        401
      );
    }

    if (!user.emailVerified) {
      throw new ErrorResponse(
        'يرجى تأكيد بريدك الإلكتروني أولاً',
        403
      );
    }

    const token = user.getSignedJwtToken();

    setAuthCookie(res, token);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
    });
  })
);

router.get(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      throw new ErrorResponse(
        'رمز التحقق مطلوب',
        400
      );
    }

    const emailVerificationToken =
      crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      throw new ErrorResponse(
        'رمز التحقق غير صالح أو منتهي الصلاحية',
        400
      );
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    const jwtToken =
      user.getSignedJwtToken();

    setAuthCookie(res, jwtToken);

    res.json({
      success: true,
      message:
        'تم تأكيد البريد الإلكتروني بنجاح',
    });
  })
);

router.post(
  '/logout',
  protect,
  asyncHandler(async (req, res) => {
    req.user.tokenVersion =
      (req.user.tokenVersion || 0) + 1;

    await req.user.save({
      validateBeforeSave: false,
    });

    clearAuthCookie(res);

    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });
  })
);

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      throw new ErrorResponse(
        'البريد الإلكتروني مطلوب',
        400
      );
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Always return success to prevent account enumeration.
    if (!user) {
      return res.json({
        success: true,
        message:
          'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور',
      });
    }

    const resetToken =
      user.getResetPasswordToken();

    await user.save({
      validateBeforeSave: false,
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      'http://localhost:5173';

    // BrowserRouter: لا نستخدم /#/
    const resetUrl =
      `${frontendUrl}/reset-password?token=${encodeURIComponent(
        resetToken
      )}`;

    try {
      await sendEmail({
        to: user.email,
        subject:
          'إعادة تعيين كلمة المرور - Elite Cars',

        text:
          `مرحباً ${user.name || ''}\n\n` +
          `لقد طلبت إعادة تعيين كلمة المرور لحسابك في Elite Cars.\n\n` +
          `اضغط على الرابط التالي لإعادة تعيين كلمة المرور:\n\n` +
          `${resetUrl}\n\n` +
          `هذا الرابط صالح لفترة محدودة.\n\n` +
          `إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.`,

        html: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور - Elite Cars</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#0b0b0b;
  font-family:Arial,Helvetica,sans-serif;
  color:#f5f5f5;
">
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#0b0b0b;padding:40px 15px;"
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            background:#151515;
            border:1px solid #2c2c2c;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 15px 45px rgba(0,0,0,0.45);
          "
        >

          <!-- Header -->
          <tr>
            <td
              align="center"
              style="
                padding:32px 25px;
                background:#111111;
                border-bottom:1px solid #2c2c2c;
              "
            >
              <div style="
                font-size:30px;
                font-weight:700;
                letter-spacing:1px;
                color:#ffffff;
              ">
                Elite
                <span style="color:#b8945a;">Cars</span>
              </div>

              <div style="
                margin-top:8px;
                color:#999999;
                font-size:13px;
                letter-spacing:1px;
              ">
                PREMIUM AUTOMOTIVE EXPERIENCE
              </div>
            </td>
          </tr>

          <!-- Gold line -->
          <tr>
            <td style="
              height:3px;
              background:#b8945a;
              font-size:0;
              line-height:0;
            ">
              &nbsp;
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td
              align="center"
              style="padding:42px 35px 35px;"
            >
              <div style="
                width:72px;
                height:72px;
                line-height:72px;
                margin:0 auto 22px;
                border-radius:50%;
                background:rgba(184,148,90,0.12);
                border:1px solid rgba(184,148,90,0.35);
                color:#b8945a;
                font-size:32px;
                font-weight:bold;
              ">
                🔐
              </div>

              <h1 style="
                margin:0 0 18px;
                color:#ffffff;
                font-size:27px;
                font-weight:700;
              ">
                استعادة كلمة المرور
              </h1>

              <p style="
                margin:0 0 12px;
                color:#e8e8e8;
                font-size:17px;
                line-height:1.9;
              ">
                مرحباً ${user.name || ''}،
              </p>

              <p style="
                margin:0 0 22px;
                color:#bcbcbc;
                font-size:15px;
                line-height:1.9;
              ">
                لقد طلبت إعادة تعيين كلمة المرور لحسابك في
                <strong style="color:#b8945a;">
                  Elite Cars
                </strong>.
              </p>

              <p style="
                margin:0 0 25px;
                color:#bcbcbc;
                font-size:15px;
                line-height:1.9;
              ">
                اضغط على الزر التالي لإنشاء كلمة مرور جديدة لحسابك:
              </p>

              <!-- Button -->
              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin:0 auto 25px;"
              >
                <tr>
                  <td
                    align="center"
                    style="
                      border-radius:10px;
                      background:#b8945a;
                    "
                  >
                    <a
                      href="${resetUrl}"
                      style="
                        display:inline-block;
                        padding:15px 32px;
                        color:#111111;
                        background:#b8945a;
                        text-decoration:none;
                        font-size:16px;
                        font-weight:700;
                        border-radius:10px;
                      "
                    >
                      إعادة تعيين كلمة المرور
                    </a>
                  </td>
                </tr>
              </table>

              <p style="
                margin:0 0 10px;
                color:#999999;
                font-size:13px;
                line-height:1.8;
              ">
                إذا لم يعمل الزر، يمكنك نسخ الرابط التالي إلى المتصفح:
              </p>

              <div style="
                padding:14px;
                background:#0f0f0f;
                border:1px solid #292929;
                border-radius:10px;
                direction:ltr;
                text-align:left;
                word-break:break-all;
              ">
                <a
                  href="${resetUrl}"
                  style="
                    color:#b8945a;
                    text-decoration:none;
                    font-size:12px;
                  "
                >
                  ${resetUrl}
                </a>
              </div>

              <p style="
                margin:22px 0 0;
                color:#777777;
                font-size:12px;
                line-height:1.8;
              ">
                هذا الرابط صالح لفترة محدودة.
              </p>

              <p style="
                margin:12px 0 0;
                color:#666666;
                font-size:12px;
                line-height:1.8;
              ">
                إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="
                padding:22px 20px;
                background:#101010;
                border-top:1px solid #252525;
              "
            >
              <div style="
                color:#b8945a;
                font-size:15px;
                font-weight:700;
                margin-bottom:8px;
              ">
                Elite Cars
              </div>

              <div style="
                color:#666666;
                font-size:11px;
                line-height:1.7;
              ">
                رسالتك للتميز تبدأ من هنا
              </div>

              <div style="
                color:#555555;
                font-size:10px;
                margin-top:8px;
              ">
                © Elite Cars. جميع الحقوق محفوظة.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(
          'Password reset email sent for:',
          user.email
        );
      }
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({
        validateBeforeSave: false,
      });

      console.error(
        'Password reset email error:',
        emailError.message
      );

      throw new ErrorResponse(
        'تعذر إرسال رسالة استعادة كلمة المرور، يرجى المحاولة لاحقاً',
        500
      );
    }

    res.json({
      success: true,
      message:
        'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني',
    });
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new ErrorResponse(
        'يرجى إدخال رمز الإعادة وكلمة المرور الجديدة',
        400
      );
    }

    if (
      typeof password !== 'string' ||
      password.length < 6
    ) {
      throw new ErrorResponse(
        'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        400
      );
    }

    if (password.length > 128) {
      throw new ErrorResponse(
        'كلمة المرور لا يمكن أن تتجاوز 128 حرفاً',
        400
      );
    }

    const resetPasswordToken =
      crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    }).select(
      '+password +resetPasswordToken +resetPasswordExpire'
    );

    if (!user) {
      throw new ErrorResponse(
        'رمز الإعادة غير صالح أو منتهي الصلاحية',
        400
      );
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    user.tokenVersion =
      (user.tokenVersion || 0) + 1;

    await user.save();

    const jwtToken =
      user.getSignedJwtToken();

    setAuthCookie(res, jwtToken);

    res.json({
      success: true,
      message:
        'تم إعادة تعيين كلمة المرور بنجاح',
    });
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      user: req.user,
    });
  })
);

router.put(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const allowedFields = [
      'name',
      'phone',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== 'string' ||
        !updates.name.trim()
      ) {
        throw new ErrorResponse(
          'الاسم غير صالح',
          400
        );
      }

      updates.name =
        updates.name.trim();
    }

    if (
      updates.phone !== undefined &&
      updates.phone
    ) {
      if (
        !AZ_PHONE_REGEX.test(
          String(updates.phone).trim()
        )
      ) {
        throw new ErrorResponse(
          'رقم الهاتف يجب أن يكون رقم أذربيجاني صالحاً',
          400
        );
      }

      updates.phone =
        String(updates.phone).trim();
    }

    Object.assign(req.user, updates);

    await req.user.save();

    const userResponse =
      req.user.toObject();

    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
    });
  })
);

router.put(
  '/password',
  protect,
  asyncHandler(async (req, res) => {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      throw new ErrorResponse(
        'كلمة المرور الحالية والجديدة مطلوبتان',
        400
      );
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      throw new ErrorResponse(
        'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
        400
      );
    }

    if (newPassword.length > 128) {
      throw new ErrorResponse(
        'كلمة المرور لا يمكن أن تتجاوز 128 حرفاً',
        400
      );
    }

    const user =
      await User.findById(
        req.user._id
      ).select('+password');

    if (!user) {
      throw new ErrorResponse(
        'المستخدم غير موجود',
        404
      );
    }

    const isMatch =
      await user.comparePassword(
        currentPassword
      );

    if (!isMatch) {
      throw new ErrorResponse(
        'كلمة المرور الحالية غير صحيحة',
        401
      );
    }

    user.password = newPassword;

    user.tokenVersion =
      (user.tokenVersion || 0) + 1;

    await user.save();

    const token =
      user.getSignedJwtToken();

    setAuthCookie(res, token);

    res.json({
      success: true,
      message:
        'تم تغيير كلمة المرور بنجاح',
    });
  })
);

router.get(
  '/users',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 20,
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    const [users, total] =
      await Promise.all([
        User.find({})
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),

        User.countDocuments({}),
      ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(
          total / limit
        ),
      },
    });
  })
);

router.put(
  '/users/:id/role',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      throw new ErrorResponse(
        'الدور غير صالح',
        400
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      throw new ErrorResponse(
        'معرف المستخدم غير صالح',
        400
      );
    }

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      throw new ErrorResponse(
        'المستخدم غير موجود',
        404
      );
    }

    user.role = role;

    await user.save();

    const userResponse =
      user.toObject();

    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
    });
  })
);

/*
 * =========================================================
 * حذف مستخدم
 * =========================================================
 *
 * DELETE /api/auth/users/:id
 *
 * يسمح للأدمن بحذف أي مستخدم،
 * مع منع الأدمن من حذف حسابه الحالي.
 */

router.delete(
  '/users/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      throw new ErrorResponse(
        'معرف المستخدم غير صالح',
        400
      );
    }

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      throw new ErrorResponse(
        'المستخدم غير موجود',
        404
      );
    }

    // منع الأدمن من حذف حسابه الإداري الحالي
    if (
      String(user._id) ===
      String(req.user._id)
    ) {
      throw new ErrorResponse(
        'لا يمكنك حذف حسابك الإداري الحالي',
        400
      );
    }

    await User.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message:
        'تم حذف المستخدم بنجاح',
    });
  })
);

router.get(
  '/favorites',
  protect,
  asyncHandler(async (req, res) => {
    const user =
      await User.findById(
        req.user._id
      ).populate('favorites');

    res.json({
      success: true,
      favorites:
        user.favorites || [],
    });
  })
);

router.post(
  '/favorites/:carId',
  protect,
  asyncHandler(async (req, res) => {
    const { carId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        carId
      )
    ) {
      throw new ErrorResponse(
        'معرف السيارة غير صالح',
        400
      );
    }

    const car =
      await Car.findById(carId);

    if (!car) {
      throw new ErrorResponse(
        'السيارة غير موجودة',
        404
      );
    }

    const user =
      await User.findById(
        req.user._id
      );

    const alreadyFavorite =
      user.favorites.some(
        id =>
          String(id) ===
          String(carId)
      );

    if (alreadyFavorite) {
      user.favorites =
        user.favorites.filter(
          id =>
            String(id) !==
            String(carId)
        );
    } else {
      user.favorites.push(carId);
    }

    await user.save();

    res.json({
      success: true,
      favorites:
        user.favorites,
    });
  })
);

module.exports = router;
