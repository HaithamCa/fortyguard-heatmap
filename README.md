# FortyGuard Heatmap

Monorepo with a Vite frontend (`client/`) and TypeScript Express backend (`server/`).

## Backend (server)

Run locally:

```bash
cd server
npm install
npm run dev
```

Health check:

```
GET http://localhost:5000/api/health
```

Environment: copy `.env.example` (or add `.env`) and set `PORT`, `FORTYGUARD_API_KEY`, `FORTYGUARD_BASE_URL`.

## CI

A GitHub Actions workflow runs TypeScript checks for the `server` package on push and pull requests.
