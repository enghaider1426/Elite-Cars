/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

/**
 * Protect routes - requires valid JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Prefer the HttpOnly auth cookie; keep Bearer support for backward compatibility.
  const cookies = parseCookies(req.headers.cookie);
  token = cookies.auth_token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح - يرجى تسجيل الدخول',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id
    req.user = await User.findById(decoded.id);

    if (req.user && Number(decoded.tokenVersion || 0) !== Number(req.user.tokenVersion || 0)) {
      return res.status(401).json({ success: false, message: 'انتهت جلسة المصادقة - يرجى تسجيل الدخول مجدداً' });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة غير صالح',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية الرمز - يرجى تسجيل الدخول مجدداً',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'خطأ في المصادقة',
    });
  }
};

/**
 * Optional auth - sets req.user if token exists, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
  let token;

  const cookies = parseCookies(req.headers.cookie);
  token = cookies.auth_token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Ignore token errors for optional auth
    }
  }

  next();
};

/**
 * Admin-only middleware - must be used after protect
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'غير مصرح - يتطلب صلاحيات المسؤول',
  });
};

module.exports = { protect, optionalAuth, admin };
