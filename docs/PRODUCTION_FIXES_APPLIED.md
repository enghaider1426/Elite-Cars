# Production/Security Fixes Applied

This pass intentionally preserved the existing UI, visual design, routes, and business features except where a security fix required authentication-flow behavior to change.

## Fixed
- Added real email ownership verification with one-time hashed verification tokens and 24-hour expiry.
- Prevented password login before email verification.
- Moved application authentication from browser localStorage JWT storage to an HttpOnly auth cookie.
- Kept Bearer-token support in backend middleware for backward compatibility with external/API clients.
- Added tokenVersion-based session invalidation on logout, password change, and password reset.
- Reduced default JWT lifetime from 30 days to 7 days.
- Added explicit logout endpoint.
- Added secure Google OAuth state validation.
- Added cryptographic Google ID-token signature verification plus issuer/audience/expiry/sub/email_verified checks.
- Removed JWT from the Google OAuth redirect URL.
- Added cryptographic Apple identity-token signature verification plus issuer/audience/expiry/sub checks.
- Added secure cookie credentials to frontend authenticated requests.
- Validated favorite car IDs and verified the referenced car exists before adding it.
- Removed unused vulnerable Multer dependency.
- Disabled production database seeding and removed hard-coded demo credentials from the seed script.
- Added production environment validation for required secrets/configuration.
- Removed environment details from the health response.
- Added optional trusted-proxy configuration for correct production rate limiting/cookie behavior.
- Added a small automated backend syntax test suite.
- Replaced hard-coded SEO `SITE_URL` placeholders in `index.html` with Vite environment substitution and removed the fake `/car/1` sitemap entry.

## Intentionally NOT changed
- Existing UI design, CSS, branding, colors, animations, and component layout.
- Existing car/business functionality.
- Existing admin role model and server-side authorization.
- Existing password hashing approach.

## Verification
- Node syntax checks: passed for modified backend files.
- Automated Node test suite: 6/6 syntax tests passed.
- Full frontend production build could not be completed in this environment because dependency installation did not finish within the available execution window. Do not treat this as a successful production build until `npm run build` is run in the project environment.

## Required deployment configuration
- Set `FRONTEND_URL` to the real frontend origin.
- Set `COOKIE_SAMESITE=none` when frontend/backend are on different sites and use HTTPS.
- Set `SMTP_USER` and `SMTP_PASS` for email verification and password reset.
- Set a strong random `JWT_SECRET` (32+ characters minimum).
- Set real `CORS_ORIGIN` values.
- Set `VITE_SITE_URL` to the real public frontend URL before production build.
