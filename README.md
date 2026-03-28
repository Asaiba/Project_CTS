# CTS Project (College Tokenized System)

CTS is a full-stack project funding platform with:
- Web frontend (Vite + static HTML pages)
- Backend API (Express + Prisma + PostgreSQL)
- On-chain integration (Sepolia contract for college/student/DAO actions)

## Project Structure

```text
Project_CTS/
  backend/      # Express API, Prisma schema, auth, uploads
  frontend/     # Vite app + dashboard pages
  docker-compose.yml  # Local PostgreSQL (and optional backend service)
```

## How The App Works

### 1) Authentication and sessions
- User registers via `register.html` (currently student self-registration).
- Backend stores user in PostgreSQL and issues JWT access/refresh tokens.
- Session info is stored in browser localStorage and refreshed via refresh token.

### 2) Roles
- `admin`: manages users (promote role, create institution/dao/admin accounts)
- `college`: reviews applications, publishes proposals to DAO
- `dao`: votes on proposals and can fund selected offers
- `student`: applies to colleges, views governance outcomes, can withdraw funded project

### 3) Off-chain vs on-chain data
- Off-chain (PostgreSQL): auth, profiles, applications, audit logs.
- On-chain (Sepolia contract): registered colleges/students/dao members, proposals, votes, offer selection, funding/withdrawal flow.

### 4) Current contract integration
- Contract address is configured in `frontend/src/js/config.js`.
- Backend can auto-register newly created students on-chain when `ETH_RPC_URL`, `CTS_CONTRACT_ADDRESS`, and `CTS_OWNER_PRIVATE_KEY` are configured.

## Local Installation (Step-by-step)

### Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose
- MetaMask (for wallet and Sepolia transactions)

### 1) Start PostgreSQL
From repo root:

```powershell
docker compose up -d db
```

### 2) Configure backend env

```powershell
cd backend
copy .env.example .env
```

Edit `backend/.env` and set:
- `DATABASE_URL` (default local URL is already in `.env.example`)
- JWT secrets
- `FRONTEND_ORIGIN=http://localhost:5173`
- `APP_BASE_URL=http://localhost:5173`
- SMTP settings if you want invite/reset emails through SendGrid
- `ETH_RPC_URL`
- `CTS_CONTRACT_ADDRESS`
- `CTS_OWNER_PRIVATE_KEY`

### 3) Install backend dependencies and migrate DB

```powershell
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
node prisma/seed.js
```

### 4) Start backend

```powershell
cd backend
node src/server.js
```

Health check:
- `http://localhost:4000/api/health` -> `{"status":"ok"}`

### 5) Start frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:
- `http://localhost:5173`

## Render Deployment Checklist

### Backend service
- Root directory: `backend`
- Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command: `npm start`

Set these environment variables in Render:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_ORIGIN=https://your-frontend.onrender.com`
- `APP_BASE_URL=https://your-frontend.onrender.com`
- `SMTP_HOST=smtp.sendgrid.net`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=apikey`
- `SMTP_PASS=<your SendGrid API key>`
- `SMTP_FROM=<your verified sender>`
- `ETH_RPC_URL`
- `CTS_CONTRACT_ADDRESS=0xEAf24CD54048A6CED382A1B80E2E7AE4A221913d`
- `CTS_OWNER_PRIVATE_KEY`

### Frontend static site
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

Set this environment variable in Render:
- `VITE_API_BASE_URL=https://your-backend.onrender.com`

For the password setup flow to work in production:
- `APP_BASE_URL` must point to the deployed frontend URL.
- `FRONTEND_ORIGIN` must include the deployed frontend URL so backend CORS allows it.
- SendGrid sender verification must be complete for `SMTP_FROM`.

## Default Seed Admin
- Email: `admin@cts.local`
- Password: `*******`

## Local Notes
- If `npm run dev` fails on Windows with `spawn EPERM`, keep using `node src/server.js` for the backend.
