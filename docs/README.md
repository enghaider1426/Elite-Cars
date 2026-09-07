# Elite Cars - معرض السيارات الفاخرة

A luxury car showroom web application built with React, Vite, Express.js, and MongoDB.

## Features

- Luxury car inventory with search and filters
- User authentication (Login, Register, Google OAuth)
- Admin dashboard for car management
- Favorites and user profiles
- Responsive RTL Arabic design
- SEO optimized with sitemap and structured data

## Tech Stack

**Frontend:** React 19, Vite, React Router 7, React Icons
**Backend:** Node.js, Express.js, MongoDB, Mongoose
**Auth:** JWT, bcryptjs, Google OAuth
**Security:** Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 22+ LTS
- MongoDB (local or Atlas)
- Google OAuth credentials (optional)

## Installation

### Frontend

```bash
cd /path/to/project
npm install
```

### Backend

```bash
cd server
npm install
```

## Environment Variables

### Frontend (.env)

See `.env.example` for all variables.

### Backend (server/.env)

See `server/.env.example` for all variables.

## Running Locally

### Frontend

```bash
npm run dev
```

### Backend

```bash
cd server
npm run dev
```

## Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Set redirect URI to `YOUR_BACKEND_URL/api/auth/google/callback`
4. Add credentials to `server/.env`

## Google Search Console

1. `robots.txt` and `sitemap.xml` are in `public/`
2. Replace `SITE_URL` placeholder in both files
3. Add your verification meta tag in `index.html`

## Build

```bash
npm run build
```

Output will be in `dist/`.

## Deployment

### Frontend (Netlify)

1. Build: `npm run build`
2. Deploy `dist/` folder
3. `_redirects` file is included for SPA routing

### Backend (Railway/Render/Heroku)

1. Set environment variables
2. Start: `node server/server.js`

## Contact

- **Location:** سوريا / أدلب / كفرسجنة
- **Phone:** +994 40 678 71 68
