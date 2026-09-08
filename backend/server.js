/**
 * Elite Cars Showroom - Main Server Entry Point
 * Express.js Backend with MongoDB Authentication
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import database connection
const connectDB = require('./config/db');

// Import routes
const carRoutes = require('./routes/cars');
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const translationRoutes = require('./routes/translation');

// Import error handling
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Validate mandatory production configuration before accepting traffic.
const validateProductionEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CORS_ORIGIN',
    'FRONTEND_URL',
    'RESEND_API_KEY',
    'OPENAI_API_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`
    );
  }

  if (
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.includes('change-this')
  ) {
    throw new Error(
      'JWT_SECRET must be a unique random secret of at least 32 characters in production'
    );
  }
};

validateProductionEnv();

// Initialize express app
const app = express();

// Honor proxy headers in production so rate limiting and secure cookies work correctly behind a trusted reverse proxy.
if (process.env.TRUST_PROXY) {
  app.set(
    'trust proxy',
    process.env.TRUST_PROXY === 'true'
      ? 1
      : process.env.TRUST_PROXY
  );
}

// ============================================
// Security & Rate Limiting Middleware
// ============================================

// CORS: support comma-separated multiple origins from env
function getCorsOrigins() {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return origins;
}

const corsOrigins = getCorsOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('غير مصرح بطلبات من هذا المصدر'));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],

  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// CSRF protection for cookie-authenticated state-changing browser requests.
// Bearer-token API clients remain supported without an Origin header.
const stateChangingMethods = new Set([
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

app.use((req, res, next) => {
  if (!stateChangingMethods.has(req.method)) return next();

  const hasAuthCookie =
    /(?:^|;\s*)auth_token=/.test(req.headers.cookie || '');

  const hasBearerAuth =
    typeof req.headers.authorization === 'string' &&
    req.headers.authorization.startsWith('Bearer ');

  if (!hasAuthCookie || hasBearerAuth) return next();

  const origin = req.headers.origin;

  if (origin && corsOrigins.includes(origin)) return next();

  // Some user agents may omit Origin. Accept an allowed Referer as fallback.
  const referer = req.headers.referer;

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;

      if (corsOrigins.includes(refererOrigin)) {
        return next();
      }
    } catch {
      // Invalid Referer is rejected below.
    }
  }

  return res.status(403).json({
    success: false,
    message: 'تم رفض الطلب لأسباب أمنية',
  });
});

// Set security HTTP headers with Content-Security-Policy for API
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,

    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : undefined,

    // Hide X-Powered-By
    hidePoweredBy: true,

    // Prevent MIME type sniffing
    noSniff: true,

    // Prevent clickjacking
    frameguard: { action: 'deny' },

    // XSS filter
    xssFilter: true,

    // Referrer policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  })
);

// Rate limiting - global (configurable via env)
const globalWindowMs =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) ||
  15 * 60 * 1000;

const globalMax =
  parseInt(process.env.RATE_LIMIT_MAX, 10) || 200;

const globalLimiter = rateLimit({
  windowMs: globalWindowMs,

  max: globalMax,

  message: {
    success: false,
    message: 'طلبات كثيرة جداً - يرجى المحاولة لاحقاً',
  },

  standardHeaders: true,

  legacyHeaders: false,
});

app.use(globalLimiter);

// Stricter rate limit for sensitive auth routes (login/register/forgot-password only)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 50,

  message: {
    success: false,
    message: 'محاولات تسجيل دخول كثيرة - يرجى المحاولة بعد 15 دقيقة',
  },

  skip: (req, res) => {
    // Skip rate limiting for GET /me and PUT /me (user verification)
    // Also skip for password change endpoints that are less sensitive
    return (
      req.path === '/me' ||
      req.path === '/auth/me'
    );
  },

  standardHeaders: true,

  legacyHeaders: false,
});

// Separate, more lenient limiter for protected routes like /auth/me
const protectedRouteLimiter = rateLimit({
  windowMs: 60 * 1000,

  max: 100,

  message: {
    success: false,
    message: 'عدد كبير جداً من الطلبات - يرجى الانتظار',
  },

  standardHeaders: true,

  legacyHeaders: false,
});

// ============================================
// Middleware for route-specific rate limiting
// ============================================
const applyAuthRateLimiting = (req, res, next) => {
  // Apply stricter limit to login/register/forgot-password
  if (
    req.path === '/login' ||
    req.path === '/register' ||
    req.path === '/forgot-password' ||
    req.path === '/reset-password'
  ) {
    return loginLimiter(req, res, next);
  }

  // Apply lenient limit to protected routes like /me
  if (
    req.path === '/me' ||
    req.path === '/password'
  ) {
    return protectedRouteLimiter(req, res, next);
  }

  // Default: use login limiter
  return loginLimiter(req, res, next);
};

// ============================================
// Body Parsing Middleware (request size validation)
// ============================================
const MAX_BODY_SIZE = '10mb';

app.use(
  express.json({
    limit: MAX_BODY_SIZE,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: MAX_BODY_SIZE,
  })
);

// Reject requests with Content-Length header exceeding limit (early guard)
app.use((req, res, next) => {
  const contentLength = parseInt(
    req.headers['content-length'],
    10
  );

  // 10MB = 10 * 1024 * 1024
  if (
    !isNaN(contentLength) &&
    contentLength > 10 * 1024 * 1024
  ) {
    return res.status(413).json({
      success: false,
      message: 'حجم الطلب كبير جداً',
    });
  }

  next();
});

// ============================================
// Logging
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// Static Files - Serve uploaded images
// ============================================
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Elite Cars API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
// NOTE: Frontend uses '/cars' directly (not '/api/cars'),
// so we mount car routes at both paths for compatibility.
app.use('/api/cars', carRoutes);
app.use('/cars', carRoutes);

// Auth routes
app.use(
  '/api/auth',
  applyAuthRateLimiting,
  authRoutes
);

app.use(
  '/auth',
  applyAuthRateLimiting,
  authRoutes
);

// OAuth routes
app.use('/api/auth', oauthRoutes);
app.use('/auth', oauthRoutes);

// OpenAI-backed UI translation fallback. The API key remains server-side.
app.use(
  '/api/translation',
  translationRoutes
);

// ============================================
// Error Handling
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log(
        '  =================================================='
      );
      console.log(
        '       Elite Cars Showroom Server'
      );
      console.log(
        '  =================================================='
      );
      console.log(
        `     Server: http://localhost:${PORT}`
      );
      console.log(
        `     Environment: ${
          process.env.NODE_ENV || 'development'
        }`
      );
      console.log(
        `     API: http://localhost:${PORT}/api/health`
      );
      console.log('');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(
        'Unhandled Rejection:',
        err.name,
        err.message
      );

      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error(
        'Uncaught Exception:',
        err.name,
        err.message
      );

      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(
      'Failed to start server:',
      error.message
    );

    process.exit(1);
  }
};

start();