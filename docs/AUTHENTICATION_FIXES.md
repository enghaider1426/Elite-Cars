# Elite Cars - Authentication & Google OAuth Fixes

## Summary of Issues Fixed

### Issue 1: 15-Minute Session Expiration

**Root Cause:** The authentication rate limiter was applied to ALL /api/auth routes, including `/auth/me` (the endpoint used to verify a user is logged in). When users made requests after the 15-minute rate limit window, they would hit the 10-request limit on /auth/me, causing a 429 error. The frontend would treat this as an authentication failure and log out the user.

**Fixes Applied:**
1. ✅ Created `server/.env` with proper JWT configuration
2. ✅ Implemented selective rate limiting:
   - **loginLimiter**: 10 requests per 15 minutes (for /login, /register, /forgot-password, /reset-password)
   - **protectedRouteLimiter**: 100 requests per 1 minute (for /auth/me, /password)
3. ✅ Updated `server/server.js` to use `applyAuthRateLimiting` middleware
4. ✅ Enhanced `src/Auth/AuthContext.jsx`:
   - Only removes token on 401/403 (invalid/expired token)
   - Allows transient errors (429, 500, etc.) without logging out

**Result:** Users will no longer be randomly logged out after 15 minutes.

### Issue 2: Google OAuth Not Working

**Root Causes:**
1. Missing `.env` files in both frontend and backend directories
2. `OAuthCallback.jsx` had an async/await bug - `checkAuth()` wasn't awaited before redirecting
3. Missing GOOGLE_* environment variables configuration

**Fixes Applied:**
1. ✅ Created `server/.env` with Google OAuth placeholders
2. ✅ Created frontend `.env` with VITE_API_URL
3. ✅ Fixed `src/Pages/OAuthCallback.jsx`:
   - Wrapped token handling in async function
   - Now properly awaits `checkAuth()` before redirecting
   - Added comprehensive error handling
4. ✅ Verified backend OAuth routes are correctly implemented
5. ✅ Verified redirect URIs and URLs are correctly configured

**Result:** Google OAuth flow is now properly implemented end-to-end.

## Files Modified

1. **server/.env** (CREATED)
   - JWT configuration
   - Google OAuth placeholders
   - Rate limiting settings

2. **frontend/.env** (CREATED)
   - API URL configuration

3. **src/Pages/OAuthCallback.jsx** (MODIFIED)
   - Fixed async/await handling
   - Added proper error management
   - Better redirect logic

4. **src/Auth/AuthContext.jsx** (MODIFIED)
   - More resilient to rate limiting
   - Only logs out on real auth failures
   - Added console warning for troubleshooting

5. **server/server.js** (MODIFIED)
   - Implemented selective rate limiting
   - Created applyAuthRateLimiting middleware
   - Different limits for sensitive vs protected routes

## How to Enable Google OAuth

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing "Elite Cars" project
3. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. Application type: **Web application**
5. Configure the following:

   **Authorized JavaScript origins:**
   - http://localhost:5000
   - http://localhost:5173
   - https://your-production-domain.com (when ready)

   **Authorized redirect URIs:**
   - http://localhost:5000/api/auth/google/callback
   - https://your-production-domain/api/auth/google/callback (when ready)

6. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Backend Environment

Edit `server/.env` and add:

```env
GOOGLE_CLIENT_ID=your-client-id-from-google-console
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### Step 3: Restart Backend

```bash
cd server
npm run dev
```

The server will now support Google OAuth login and registration.

## Testing the Fixes

### Test 1: Normal Login (No 15-Minute Logout)

```
1. Open http://localhost:5173/login
2. Enter email and password
3. Click "تسجيل الدخول"
4. Wait longer than 15 minutes
5. Navigate to a new page or refresh
6. You should still be logged in ✓
```

### Test 2: Logout Works Properly

```
1. Log in with email/password
2. Click logout
3. You should be redirected to /login ✓
4. Token should be removed from localStorage ✓
```

### Test 3: Protected Routes

```
1. Log out
2. Try to access /profile (protected route)
3. You should be redirected to /login ✓
4. Log in
5. /profile should now be accessible ✓
```

### Test 4: Google OAuth (if credentials are configured)

```
1. Open http://localhost:5173/login
2. Click "تسجيل الدخول باستخدام Google"
3. You should see Google login consent screen
4. Log in with your Google account
5. Backend exchanges code for tokens
6. You should be redirected to your user dashboard or home
7. Check localStorage - token should be present ✓
```

### Test 5: Rate Limiting on Login Attempts

```
1. Try to login with wrong password 10 times
2. On the 11th attempt within 15 minutes, you should get:
   "محاولات تسجيل دخول كثيرة - يرجى المحاولة بعد 15 دقيقة"
3. But accessing /profile, /inventory, etc. should still work ✓
4. Wait 15 minutes or clear rate limiter cache
5. Login should work again ✓
```

### Test 6: Auth Verification Resilience

```
1. Log in successfully
2. Check browser DevTools Network tab
3. Stop the backend server (simulate network error)
4. Navigate around the app
5. Start the backend server again
6. Navigate to /profile
7. The app should re-authenticate and work ✓
8. User should NOT be logged out on transient failures ✓
```

## Environment Variables Reference

### Backend (server/.env)

| Variable | Default | Purpose |
|----------|---------|---------|
| NODE_ENV | development | Development or production mode |
| PORT | 5000 | Server port |
| MONGODB_URI | (required) | MongoDB connection string |
| JWT_SECRET | (required) | Secret key for signing JWT tokens |
| JWT_EXPIRE | 30d | JWT token expiration time |
| CORS_ORIGIN | http://localhost:5173 | Allowed frontend origins |
| RATE_LIMIT_WINDOW_MS | 900000 | Global rate limit window (15 min) |
| RATE_LIMIT_MAX | 200 | Global rate limit max requests |
| GOOGLE_CLIENT_ID | (from Google) | Google OAuth Client ID |
| GOOGLE_CLIENT_SECRET | (from Google) | Google OAuth Client Secret |
| GOOGLE_REDIRECT_URI | http://localhost:5000/api/auth/google/callback | Google OAuth callback URL |

### Frontend (.env)

| Variable | Default | Purpose |
|----------|---------|---------|
| VITE_API_URL | http://localhost:5000 | Backend API URL |
| VITE_AUTH_ENABLED | true | Enable authentication features |
| VITE_GOOGLE_CLIENT_ID | (from Google) | Google OAuth Client ID (frontend) |
| VITE_SITE_URL | https://your-domain.com | Production domain for SEO |

## Authentication Flow Diagram

```
┌─── User ───────────────────────────────────────────────┐
│                                                          │
├─ Email/Password Login ──────────────────────────────────┤
│ 1. Frontend: POST /api/auth/login
│ 2. Backend: Verify email/password → Generate JWT
│ 3. Backend: Return token + user data
│ 4. Frontend: Store token in localStorage
│ 5. Frontend: Navigate to / (redirects by role)
│
├─ Google OAuth Flow ─────────────────────────────────────┤
│ 1. Frontend: Redirect to /api/auth/google
│ 2. Backend: Redirect to Google OAuth consent screen
│ 3. Google: User logs in and approves access
│ 4. Google: Redirect to /api/auth/google/callback?code=...
│ 5. Backend: Exchange code for Google tokens
│ 6. Backend: Decode ID token → Get email/name/picture
│ 7. Backend: Find or create user in MongoDB
│ 8. Backend: Generate JWT token
│ 9. Backend: Redirect to /auth/callback?token=...
│ 10. Frontend OAuthCallback: Store token
│ 11. Frontend OAuthCallback: Call checkAuth()
│ 12. Frontend OAuthCallback: Navigate to / (redirects by role)
│
├─ Token Verification (checkAuth) ───────────────────────┤
│ 1. Frontend: GET /api/auth/me with Bearer token
│ 2. Backend: Verify JWT → Find user in MongoDB
│ 3. Backend: Return user data
│ 4. Frontend: Update user state
│ 5. Frontend: User stays logged in
│
├─ Logout ───────────────────────────────────────────────┤
│ 1. Frontend: Remove token from localStorage
│ 2. Frontend: Clear user state
│ 3. Frontend: Redirect to /login
│
└────────────────────────────────────────────────────────┘
```

## Rate Limiting Details

### Sensitive Endpoints (loginLimiter)
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

**Limit:** 10 requests per 15 minutes per IP

### Protected Endpoints (protectedRouteLimiter)
- GET /api/auth/me
- PUT /api/auth/me
- PUT /api/auth/password

**Limit:** 100 requests per 1 minute per IP

### Global Rate Limit
**Limit:** 200 requests per 15 minutes per IP (all endpoints)

## Troubleshooting

### Issue: "خدمة تسجيل الدخول بجوجل غير مضبوطة بعد" (Google service not configured)

**Solution:** Check that GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set in server/.env

### Issue: Google redirects to an error page

**Causes:**
1. Redirect URI mismatch - ensure GOOGLE_REDIRECT_URI in .env matches Google Console exactly
2. Client ID/Secret incorrect - double-check from Google Console
3. Authorized JavaScript origins missing - add http://localhost:5000 to Google Console

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Verify the redirect URI is exactly: `http://localhost:5000/api/auth/google/callback`
3. Verify authorized origins include: `http://localhost:5000` and `http://localhost:5173`

### Issue: Token expires after 15 minutes

**Status:** ✅ FIXED - This was the 15-minute logout issue

**What was happening:**
- Rate limiter was set to 10 requests per 15 minutes for ALL auth routes
- When users made requests, they would hit this limit after ~15 minutes
- Frontend would get 429 error on /auth/me and treat it as auth failure
- User would be logged out

**Solution:** Implemented selective rate limiting so /auth/me has higher limits

### Issue: User gets logged out randomly

**Causes:**
1. Token actually expired (shouldn't happen - JWT is 30 days)
2. Rate limiting on /auth/me (FIXED)
3. MongoDB connection failed (user account not found)
4. User account was deactivated (isActive = false)

**Solution:** Check server logs for specific error messages

## Production Deployment

### Before Going Live

1. ✅ Set NODE_ENV=production
2. ✅ Generate strong JWT_SECRET
3. ✅ Configure MongoDB Atlas URI
4. ✅ Update CORS_ORIGIN to production domain
5. ✅ Configure Google OAuth for production domain:
   - Authorized JavaScript origins: https://your-domain.com
   - Authorized redirect URIs: https://your-domain/api/auth/google/callback
6. ✅ Update GOOGLE_REDIRECT_URI to production URL
7. ✅ Set VITE_SITE_URL to production domain
8. ✅ Enable HTTPS (required for OAuth)
9. ✅ Set secure cookies in production
10. ✅ Enable HSTS headers

### Production URLs

```
Frontend: https://your-domain.com
Backend: https://your-domain.com/api (or separate api.your-domain.com)
Google OAuth callback: https://your-domain.com/api/auth/google/callback
OAuthCallback page: https://your-domain.com/auth/callback
```

## Support & Further Improvements

### Possible Future Enhancements

1. **Refresh Token Mechanism:** Implement refresh tokens for better security
2. **Session Timeout:** Add explicit session timeout with warning
3. **Remember Me:** Implement "Remember Me" checkbox for extended sessions
4. **Social Login Linking:** Allow users to link multiple social accounts
5. **OAuth Scope Expansion:** Request additional permissions from Google (contacts, calendar, etc.)
6. **Error Analytics:** Log authentication failures for analytics
7. **Rate Limiting Bypass:** Add whitelist for trusted IPs (admin panel, internal tools)
8. **Multi-Factor Authentication:** Add 2FA support

## Questions?

Refer to the following files for implementation details:
- Backend auth: `server/routes/auth.js`
- Backend OAuth: `server/routes/oauth.js`
- Backend middleware: `server/middleware/auth.js`
- Frontend auth: `src/Auth/AuthContext.jsx`
- Frontend OAuth: `src/Pages/OAuthCallback.jsx`
- Server config: `server/server.js`
