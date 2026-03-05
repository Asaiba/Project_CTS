# Deploy CTS on Render (Full-Stack)

This repo now includes `render.yaml` for one-click full-stack deployment:
- PostgreSQL (`cts-db`)
- Backend API (`cts-api`)
- Frontend static site (`cts-frontend`)

## 1) Push latest code

Push this branch to GitHub (including `render.yaml`).

## 2) Create Render Blueprint

1. Open Render dashboard.
2. Click `New` -> `Blueprint`.
3. Connect your GitHub repo.
4. Render detects `render.yaml` and proposes 3 services.
5. Click `Apply`.

## 3) Set required environment values

After first creation, open service env settings and set:

### Backend (`cts-api`)
- `FRONTEND_ORIGIN=https://<your-frontend>.onrender.com`
- `ETH_RPC_URL=<your-sepolia-rpc>`
- `CTS_CONTRACT_ADDRESS=0x1d7Cd344a17A70E24779B7e7040Fb3386D5623B0`
- `CTS_OWNER_PRIVATE_KEY=<owner-private-key>`
- Optional Google/SMTP variables if needed.

### Frontend (`cts-frontend`)
- `VITE_API_BASE_URL=https://<your-backend>.onrender.com/api`

Then redeploy both services.

## 4) Verify deployment

1. Backend health:
- `https://<your-backend>.onrender.com/api/health`
- Expect: `{"status":"ok"}`

2. Frontend:
- Open `https://<your-frontend>.onrender.com`
- Test login/register and dashboard API calls.

## 5) Upload persistence

`render.yaml` mounts a persistent disk on backend:
- Mount: `/var/data`
- Upload directory: `/var/data/uploads`

This prevents uploaded logos/files from disappearing on redeploy.

## 6) Troubleshooting

### Build fails on frontend
- Ensure static service root dir is `frontend`.
- Build command should be `npm ci && npm run build`.

### CORS blocked
- Make sure backend `FRONTEND_ORIGIN` exactly matches frontend Render URL.

### On-chain registration errors
- Check backend env vars:
  - `ETH_RPC_URL`
  - `CTS_CONTRACT_ADDRESS`
  - `CTS_OWNER_PRIVATE_KEY`

