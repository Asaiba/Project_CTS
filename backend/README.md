# CTS Backend

Express + Prisma + PostgreSQL backend with JWT auth, RBAC, wallet login, on-chain registration, and email delivery via SMTP (SendGrid).

## Features
- Email/password registration and login
- Wallet login (lookup by normalized lowercase wallet address)
- Refresh token rotation with automatic 401 retry on the client
- Forgot/reset password token flow
- `admin`-only user management (create, update, deactivate, role change)
- On-chain student registration via owner wallet on user signup
- Zod request validation on all endpoints
- SMTP email delivery (SendGrid-compatible) for temporary passwords
- CORS configured for deployed frontend origins + localhost dev

## Project Structure
```
backend/
  prisma/
    schema.prisma       # DB schema (User, RefreshToken, Proposal, etc.)
    seed.js             # Seeds default admin account
  src/
    config/env.js       # All environment variable access
    controllers/        # Route handlers
    lib/                # Prisma client, JWT helpers
    middleware/         # Auth, RBAC, validation, error handler
    routes/             # Express routers
    services/           # Business logic (auth, mail, on-chain)
    utils/              # Password hashing, crypto helpers
    validators/         # Zod schemas
    app.js              # Express app setup (CORS, middleware, routes)
    server.js           # HTTP server entry point
```

## Environment Variables
Create a `.env` file in `backend/`:

```env
# Server
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend CORS (comma-separated if multiple)
FRONTEND_ORIGIN=https://your-frontend.onrender.com

# SMTP (SendGrid SMTP relay)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com

# Blockchain (Sepolia)
ETH_RPC_URL=https://sepolia.infura.io/v3/your_key
CTS_CONTRACT_ADDRESS=0x1d7Cd344a17A70E24779B7e7040Fb3386D5623B0
CTS_OWNER_PRIVATE_KEY=your_owner_private_key
```

## Local Setup
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create `.env` from the template above
3. Run migrations and generate Prisma client:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```
4. Seed the default admin user:
   ```bash
   npm run prisma:seed
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```

## Deployed API Base
- `https://project-cts.onrender.com/api`

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new student (enforces `role: student`) |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/login-wallet` | Wallet address login |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Revoke refresh token |
| POST | `/api/auth/forgot-password` | Generate password reset token |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET  | `/api/auth/me` | Get current user (requires auth) |

### Admin (requires `admin` role)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/admin/users` | List users (filterable by role, status, search) |
| POST   | `/api/admin/users` | Create user with any role + wallet address |
| PATCH  | `/api/admin/users/:id` | Update user (email, username, role, walletAddress, logoUrl, isActive) |
| PATCH  | `/api/admin/users/:id/role` | Change user role only |
| DELETE | `/api/admin/users/:id` | Deactivate/delete user |

## Seeded Admin
- Email: `admin@cts.local`
- Password: `Admin@12345`

**Change these immediately in production.**

## Notes
- All wallet addresses are normalized to lowercase before storage and lookup
- `PATCH` is required in CORS allowed methods — already configured in `app.js`
- DAO and college on-chain registration is triggered from the admin dashboard frontend (requires the contract owner wallet to be connected in MetaMask)
- Email is only sent when admin creates a user **without** providing a manual password; if a password is provided, email is skipped
- Check Render logs for `[mail]` prefixed errors if email delivery fails
