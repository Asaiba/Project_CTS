# CTS Project (College Tokenized System)

CTS is a full-stack scholarship platform with:
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
- `student`: applies to colleges, views governance outcomes, can withdraw funded scholarship

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
npm run dev
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

## Default Seed Admin
- Email: `admin@cts.local`
- Password: `Admin@12345`

Change this password after first login.

## Deployment Guides

Detailed hosting instructions are in:
- [docs/DEPLOY_RAILWAY_VERCEL.md](/c:/Users/saiba/Desktop/Project_CTS/docs/DEPLOY_RAILWAY_VERCEL.md)
- [docs/DEPLOY_RENDER.md](/c:/Users/saiba/Desktop/Project_CTS/docs/DEPLOY_RENDER.md)

Templates added:
- `backend/.env.railway.example`
- `backend/.env.render.example`
- `frontend/.env.vercel.example`
- `frontend/vercel.json`
- `backend/railway.json`
- `render.yaml` (Render full-stack blueprint)
