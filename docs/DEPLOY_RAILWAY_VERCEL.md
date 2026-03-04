# Deploy CTS on Railway (Backend) + Vercel (Frontend)

This is the recommended split deployment:
- Backend API + PostgreSQL on Railway
- Frontend static site on Vercel

## A) Deploy Backend on Railway

### 1) Push code to GitHub
- Create or use an existing GitHub repo for this project.
- Push `backend/` and `frontend/` folders.

### 2) Create Railway project
- Go to Railway dashboard.
- `New Project` -> `Deploy from GitHub`.
- Select your repo.
- Create a service from the repo with **Root Directory = `backend`**.

### 3) Add PostgreSQL in Railway
- In the same Railway project, add `PostgreSQL`.
- Railway injects `DATABASE_URL` for your backend service automatically (or copy it manually if needed).

### 4) Configure backend environment variables
Set these in Railway backend service:
- `NODE_ENV=production`
- `PORT=4000`
- `JWT_ACCESS_SECRET=<strong-random-secret>`
- `JWT_REFRESH_SECRET=<strong-random-secret>`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `FRONTEND_ORIGIN=https://<your-vercel-domain>`
- `ETH_RPC_URL=<sepolia-rpc-url>`
- `CTS_CONTRACT_ADDRESS=0x1d7Cd344a17A70E24779B7e7040Fb3386D5623B0`
- `CTS_OWNER_PRIVATE_KEY=<owner-private-key>`
- Optional SMTP vars for real email sending.

### 5) Build/Start commands
With `backend/railway.json` included, Railway uses:
- Build: Nixpacks
- Start command:
  - `npx prisma migrate deploy && npm run start`

### 6) Verify backend
- Open: `https://<railway-backend-domain>/api/health`
- Expect: `{"status":"ok"}`

## B) Deploy Frontend on Vercel

### 1) Create Vercel project
- In Vercel: `Add New Project` -> import same GitHub repo.
- Set **Root Directory = `frontend`**.

### 2) Framework/build settings
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### 3) Frontend environment variable
In Vercel project settings add:
- `VITE_API_BASE_URL=https://<railway-backend-domain>/api`

### 4) Deploy
- Trigger deploy.
- Open your Vercel domain and test login/register flows.

## C) Post-deploy checks (important)

1. Backend health:
- `GET /api/health` is `ok`.

2. CORS:
- If frontend gets CORS errors, ensure backend `FRONTEND_ORIGIN` matches exact Vercel URL.

3. On-chain auto-registration:
- Register a new student.
- Confirm backend no longer returns:
  - `On-chain registration is not configured...`

4. Contract/wallet:
- MetaMask network should be Sepolia for users doing on-chain actions.

## D) Troubleshooting

### `On-chain registration is not configured`
Missing one of:
- `ETH_RPC_URL`
- `CTS_CONTRACT_ADDRESS`
- `CTS_OWNER_PRIVATE_KEY`

### `Cannot reach backend API`
- `VITE_API_BASE_URL` is missing/wrong on Vercel.
- Railway backend service is down.

### `Not allowed by CORS`
- `FRONTEND_ORIGIN` in Railway backend must exactly match Vercel URL.

### Prisma errors on Railway startup
- Ensure PostgreSQL service is attached and `DATABASE_URL` is present.

