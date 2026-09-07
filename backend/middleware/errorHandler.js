/**
 * Custom Error Class
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Sanitize error message to remove file paths and internal details.
 * Prevents leaking server internals in error responses.
 */
function sanitizeErrorMessage(message) {
  if (typeof message !== 'string') return 'خطأ في الخادم';
  // Remove file paths (Unix and Windows)
  return message
    .replace(/\/home\/[^\s]+/g, '[path]')
    .replace(/\/Users\/[^\s]+/g, '[path]')
    .replace(/[A-Za-z]:\\[^\s]+/g, '[path]')
    .replace(/at\s+\S+\s*\(/g, '')
    .slice(0, 500); // Limit message length
}

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log full error for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'المورد غير موجود';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    // Don't expose the field name in production to avoid information leakage
    const message = process.env.NODE_ENV === 'production'
      ? 'هذه القيمة موجودة مسبقاً'
      : `هذه القيمة موجودة مسبقاً: ${Object.keys(err.keyValue)[0]}`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(messages.join('. '), 400);
  }

  // JSON Web Token error
  if (err.name === 'JsonWebTokenError') {
    const message = 'رمز المصادقة غير صالح';
    error = new ErrorResponse(message, 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'انتهت صلاحية الرمز';
    error = new ErrorResponse(message, 401);
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'حجم الملف كبير جداً';
    error = new ErrorResponse(message, 400);
  }

  // Catch-all for Mongoose internal errors (e.g., BufferingTimeout, etc.)
  if (err.name && err.name.startsWith('Mongo')) {
    error = new ErrorResponse('خطأ في قاعدة البيانات', 500);
  }

  // Build response
  const isDev = process.env.NODE_ENV === 'development';
  const response = {
    success: false,
    message: sanitizeErrorMessage(error.message || 'خطأ في الخادم'),
  };

  // Only include stack in development mode
  if (isDev) {
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

/**
 * 404 Not Found Handler
 */
const notFound = (req, res, next) => {
  // Don't expose the requested URL in production
  const message = process.env.NODE_ENV === 'production'
    ? 'الصفحة غير موجودة'
    : `الصفحة غير موجودة - ${req.originalUrl}`;
  const error = new ErrorResponse(message, 404);
  next(error);
};

/**
 * Async Handler - wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ErrorResponse, errorHandler, notFound, asyncHandler };
