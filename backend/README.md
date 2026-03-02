# CTS Backend

Express + Prisma + PostgreSQL backend with JWT auth, RBAC, and wallet-first login support.

## Features
- Email/password registration and login
- Wallet login (`walletAddress` only; wallet owner verification should be added next)
- Refresh token rotation
- Forgot/reset password token flow
- `admin`-only user role management
- Zod request validation

## Project Structure
```
backend/
  prisma/
  src/
    controllers/
    middleware/
    routes/
    services/
    validators/
```

## Local Setup
1. Install dependencies:
   - `cd backend`
   - `npm install`
2. Create env:
   - copy `.env.example` to `.env`
3. Run migrations and generate Prisma client:
   - `npm run prisma:migrate`
   - `npm run prisma:generate`
4. Seed admin user:
   - `npm run prisma:seed`
5. Start server:
   - `npm run dev`

## Docker Setup
From repo root:
- `docker compose up --build`

## API Base
- `http://localhost:4000/api`

## Key Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/login-wallet`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/admin/users` (admin)
- `PATCH /api/admin/users/:id/role` (admin)

## Seeded Admin
- Email: `admin@cts.local`
- Password: `Admin@12345`

Change immediately in real environments.
