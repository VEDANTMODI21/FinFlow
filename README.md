
# FinFlow - Secure Personal Finance Manager

A modern, full-stack personal finance application with secure OTP-based authentication, budget tracking, and expense management.

![FinFlow Preview](https://img.shields.io/badge/React-18-blue?logo=react&style=flat-square) ![Node.js](https://img.shields.io/badge/Node-20%2B-green?style=flat-square) ![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite&style=flat-square) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&style=flat-square)

## Features

✨ **Secure Authentication**
- OTP-based email verification
- Password-protected accounts
- Session management with localStorage (upgradeable to secure sessions)

💰 **Budget Management**
- Track income and expenses by category
- Set and monitor budget limits
- Visual spending analytics with charts
- Savings goals tracking

🎨 **Modern UI/UX**
- Beautiful gradient-based design
- Smooth animations with Framer Motion
- Dark mode support
- Fully responsive (mobile, tablet, desktop)

⚡ **Performance**
- Lightning-fast builds with Vite
- Optimized React components
- Efficient data visualization with Recharts

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment template
cp .env.example .env.local

# Add your API keys (optional for development)
# RESEND_API_KEY=your_key

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

## Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
1. Push to GitHub
2. Import repository to Vercel
3. Add environment variables (optional: `RESEND_API_KEY`)
4. Deploy

## Project Structure

```
├── src/
│   ├── App.tsx                 # Main React app
│   ├── components/             # React components
│   │   ├── AuthPage.tsx       # Authentication UI
│   │   ├── BudgetTracker.tsx  # Dashboard
│   │   └── OtpFlow.tsx        # OTP verification
│   └── index.css              # Global styles
├── server.ts                  # Express backend
├── vite.config.ts             # Build configuration
├── vercel.json                # Vercel config
└── db.json                    # Data storage
```

## API Endpoints

### Auth
- `POST /api/check-email` - Check if email exists
- `POST /api/send-otp` - Send OTP code
- `POST /api/verify-otp` - Verify OTP
- `POST /api/set-password` - Create new account
- `POST /api/login-password` - Sign in

### Budget
- `GET /api/budget-data` - Get all budget data
- `POST /api/transactions` - Add transaction
- `POST /api/budgets` - Set budget limit
- `POST /api/savings-goals` - Create savings goal

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Optional | Email service API key |
| `SENDER_EMAIL` | No | Email sender address |
| `PORT` | No | Server port (default: 3000) |

## Tech Stack

**Frontend:**
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- Recharts (charts)
- Lucide React (icons)

**Backend:**
- Express.js
- Node.js
- JSON file storage (for demo)

**Deployment:**
- Vercel (hosting)
- Resend or Brevo (email)

## Performance Metrics

- ✅ Bundle size: ~770KB (gzipped: ~222KB)
- ✅ Build time: ~3-4 seconds
- ✅ Dev server startup: <1 second
- ✅ Page load: <2 seconds

## Security

⚠️ **Production Considerations:**
- Replace localStorage with secure HTTP-only cookies
- Implement server-side session management
- Add rate limiting to API endpoints
- Use database instead of JSON file
- Enable CORS properly
- Add input validation and sanitization

See [DEPLOYMENT.md](./DEPLOYMENT.md#security-considerations) for more details.

## Troubleshooting

**Login not working?**
- Check email service configuration
- For development without API keys, OTP appears in console
- Clear browser localStorage

**Build errors?**
- Run `npm install --legacy-peer-deps`
- Clear node_modules and reinstall
- Check Node.js version (18+)

**Vercel deployment issues?**
- Ensure environment variables are set
- Check build logs in Vercel dashboard
- Verify build command: `npm run build`

## Contributing

Contributions welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to branch
5. Open a pull request

## License

MIT License - See LICENSE file

## Support

- 📚 [Deployment Guide](./DEPLOYMENT.md)
- 🐛 [Report Issues](../../issues)
- 💬 [Discussions](../../discussions)

---

**Built with ❤️ for secure personal finance management**

