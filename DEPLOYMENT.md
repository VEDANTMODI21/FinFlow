# FinFlow - Deployment Guide

## Overview

FinFlow is a full-stack personal finance management application built with React, Express, and Vite. This guide covers deployment to Vercel.

## Prerequisites

- Node.js 18+ and npm
- A Vercel account (free tier available at https://vercel.com)
- Git repository connected to Vercel
- (Optional) Email service API key (Resend or Brevo) for OTP verification

## Quick Start - Deploy to Vercel

### 1. Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select your GitHub repository containing this code
4. Click "Import"

### 2. Configure Environment Variables

In the Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```
RESEND_API_KEY=your_api_key_here
# OR
BREVO_API_KEY=your_api_key_here
```

**Important**: You only need ONE of the above email providers. Leave the other blank.

### 3. Deploy

Click "Deploy" - Vercel will automatically:
- Install dependencies
- Run `npm run build` to build the React frontend and backend
- Start the application on a Vercel URL

## Local Development

### Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Create local environment file
cp .env.example .env.local

# Add your API keys to .env.local
# RESEND_API_KEY=your_key_or_BREVO_API_KEY=your_key
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── src/
│   ├── App.tsx              # Main React component
│   ├── components/          # React components
│   │   ├── AuthPage.tsx     # Login/authentication UI
│   │   ├── BudgetTracker.tsx # Main dashboard
│   │   └── ...
│   └── index.css            # Global styles
├── server.ts                # Express backend server
├── vite.config.ts           # Vite build configuration
├── vercel.json              # Vercel deployment config
└── package.json             # Dependencies
```

## Features

### Authentication Flow
1. **Email Check**: User enters email
2. **Existing User**: Sign in with password
3. **New User**: Verify with OTP, then set password
4. **Session**: Stored in localStorage for demo (upgrade to secure sessions for production)

### Budget Tracking
- Track income and expenses
- Set budget limits per category
- Create savings goals
- Monitor spending with charts
- Dark mode support

## API Endpoints

### Authentication
- `POST /api/check-email` - Check if email exists
- `POST /api/send-otp` - Send OTP verification
- `POST /api/verify-otp` - Verify OTP code
- `POST /api/set-password` - Set password for new user
- `POST /api/login-password` - Sign in with password

### Budget Management
- `GET /api/budget-data` - Get all budget data for user
- `POST /api/transactions` - Add transaction
- `POST /api/budgets` - Set category budget
- `POST /api/savings-goals` - Create savings goal
- `POST /api/savings-goals/:id/contribute` - Add to savings goal

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Optional | Resend email API key |
| `BREVO_API_KEY` | Optional | Brevo email API key |
| `SENDER_EMAIL` | No | Email sender address |
| `SENDER_NAME` | No | Email sender name |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |

## Email Configuration

### Using Resend (Recommended)

1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Add to Vercel environment: `RESEND_API_KEY=your_key`

### Using Brevo

1. Sign up at https://www.brevo.com
2. Get your API key from settings
3. Add to Vercel environment: `BREVO_API_KEY=your_key`

### Development Mode (No Email Service)

If no email service is configured:
- OTP codes are logged to the server console
- Users can see the code in development
- Perfect for testing locally

## Build Output

- **Frontend**: React app compiled to `/dist` folder
- **Backend**: Express server bundled as `/dist/server.cjs`
- **HTML**: Static files served at `/dist/index.html`

Vercel automatically serves:
- Static files from `/dist` with caching
- API routes through the Express server

## Performance Optimization

### Current Optimizations
- Vite for fast builds
- CSS minification with Tailwind
- React 18 with automatic batching
- Framer Motion for smooth animations
- Recharts for efficient charting

### Further Improvements
- Enable gzip compression
- Add database instead of JSON file storage
- Implement proper session management
- Add Redis for caching
- Optimize bundle size (currently ~770KB)

## Troubleshooting

### 503 Bad Gateway
- Check if all dependencies installed correctly
- Ensure `npm run build` completes without errors
- Verify environment variables are set

### Login Issues
- Check email service API key configuration
- Verify `SENDER_EMAIL` is configured correctly
- Check server logs for OTP sending errors

### Blank Page
- Clear browser cache
- Check browser console for JavaScript errors
- Verify API endpoints are responding

## Security Considerations

⚠️ **Before Production Deployment**:

1. **Replace localStorage with secure sessions**
   - Implement server-side sessions with secure cookies
   - Use httpOnly flag for cookies

2. **Add HTTPS enforcement**
   - Vercel automatically provides HTTPS
   - Redirect HTTP to HTTPS

3. **Input Validation**
   - All inputs are validated server-side
   - Consider adding rate limiting

4. **Database Security**
   - Current app uses JSON file (demo only)
   - Production should use PostgreSQL/MongoDB
   - Implement Row-Level Security (RLS)

5. **API Security**
   - Add API rate limiting
   - Implement CORS properly
   - Use environment variables for secrets

## Monitoring

### Vercel Analytics
- Go to Vercel dashboard → Your Project → Analytics
- Monitor Web Vitals and performance

### Application Health
- Logs available in Vercel dashboard
- Check for errors in Edge Functions logs

## Support

For issues with:
- **Vercel Deployment**: https://vercel.com/support
- **Resend Email**: https://resend.com/docs
- **Brevo Email**: https://www.brevo.com/support
- **Application**: Check GitHub issues

## License

MIT License - See LICENSE file for details
