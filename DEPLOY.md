# Deploy HeatSafe

Deploy backend first, then frontend with `VITE_API_BASE_URL` pointing at the backend `/api`.

## 1) Backend (Railway or Render)

### Required env vars
```env
PORT=8088
FORTYGUARD_API_KEY=********
FORTYGUARD_BASE_URL=https://api.fortyguard.com/v1
DEV_MOCK=false
NODE_ENV=production
```

### Railway (recommended)
1. New project → Deploy from GitHub repo `HaithamCa/fortyguard-heatmap`
2. Set Root Directory: `server`
3. Start command: `npm run start`
4. Add env vars above
5. Generate public domain, e.g. `https://heatsafe-api.up.railway.app`

Health check: `https://YOUR-BACKEND/api/health`

### Render alternative
Use `render.yaml` in repo root, or create a Web Service:
- Root dir: `server`
- Build: `npm install`
- Start: `npm run start`

## 2) Frontend (Vercel)

1. Import GitHub repo in Vercel
2. Root Directory: `client`
3. Framework: Vite
4. Env var (Production):
   ```env
   VITE_API_BASE_URL=https://YOUR-BACKEND/api
   ```
5. Deploy

Optional: `client/vercel.json` is included for SPA routing.

## 3) Post-deploy verification
1. Open frontend URL
2. Start Analysis
3. Draw small US AOI
4. Confirm activity id is a real UUID (not `mock-...`)
5. Confirm map tiles + Google Maps recommendation buttons work

## 4) Submission links to fill in
- Public repo: https://github.com/HaithamCa/fortyguard-heatmap
- Live app: `______________________________`
- Demo video: `______________________________`
