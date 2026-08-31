# HeatSafe — FortyGuard Hackathon'26

Urban heat intelligence dashboard built on the **FortyGuard Temperature API®**.

**Live demo:** _add your deployed URL after hosting_  
**Repository:** https://github.com/HaithamCa/fortyguard-heatmap

HeatSafe helps people and city teams:
1. Draw an area of interest
2. Run a hyperlocal temperature analysis via FortyGuard
3. See cooler vs hotter zones (blue → red)
4. Get place recommendations and open them in Google Maps

> **Coverage note:** FortyGuard API regional coverage is currently **United States only**. Use a small US AOI for demos.

---

## Architecture

```
React (Vite)  →  Express API  →  FortyGuard Temperature API
client/           server/         POST /v1/heatmap
                                  GET  /v1/status/:activityId
```

- **Client:** map drawing, async polling, heat visualization, recommendations
- **Server:** secure API-key proxy, response transform (tiles → summary/hotspots), DEV_MOCK mode
- **FortyGuard:** async submit + poll pattern for heatmap generation

---

## Quick start (local)

### 1) Environment

Copy `.env.example` to `.env` and `server/.env`:

```bash
cp .env.example .env
cp .env.example server/.env
```

Set:

```env
PORT=8088
FORTYGUARD_API_KEY=your_key
FORTYGUARD_BASE_URL=https://api.fortyguard.com/v1
DEV_MOCK=false
```

For offline UI demos only:

```env
DEV_MOCK=true
```

### 2) Backend

```bash
cd server
npm install
npm run dev
```

Health: `GET http://localhost:8088/api/health`

### 3) Frontend

```bash
cd client
npm install
npm run dev
```

Open: http://localhost:5173/

Vite proxies `/api` → `http://localhost:8088`.

---

## API usage (our backend)

### Submit heatmap

`POST /api/heatmap`

```json
{
  "polygon_aoi": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-74.0170, 40.7050],
            [-74.0030, 40.7050],
            [-74.0030, 40.7180],
            [-74.0170, 40.7180],
            [-74.0170, 40.7050]
          ]]
        }
      }
    ]
  },
  "date_time": {
    "start_date": "2024-07-15",
    "start_time": "14:00",
    "filter_type": 1
  },
  "granularity": 100
}
```

Response:

```json
{ "activityId": "uuid..." }
```

### Poll status

`GET /api/status/:activityId`

When complete, response includes:
- `status`
- `summary` (`minimum`, `average`, `maximum`)
- `hotspots` / `keyTemperatures`
- `geojson` heatmap tiles

---

## How FortyGuard is used

1. User draws AOI in HeatSafe
2. Server forwards `FeatureCollection` + datetime + granularity to `POST /v1/heatmap`
3. Client polls `GET /v1/status/{activity_id}` through our proxy
4. Server maps FortyGuard `map_data` + `stats_data` into UI-friendly summary/hotspots
5. UI renders cool→hot colors, recommendations, and Google Maps links

Granularity supported: **60 / 80 / 100** meters. Filter type currently used: **1 (single hour)**.

---

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Railway/Render + Vercel steps.

Required production env:

| Variable | Where |
|---|---|
| `FORTYGUARD_API_KEY` | Backend |
| `FORTYGUARD_BASE_URL` | Backend (`https://api.fortyguard.com/v1`) |
| `DEV_MOCK=false` | Backend |
| `VITE_API_BASE_URL` | Frontend build (`https://YOUR-API/api`) |

---

## Submission materials

- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) — problem, solution, impact
- [DEMO.md](./DEMO.md) — 2–5 minute demo video script
- [DEPLOY.md](./DEPLOY.md) — hosting checklist

---

## Tech stack

- React 19 + Vite + Leaflet + TypeScript
- Express 5 + Axios + dotenv
- FortyGuard Temperature API®

## License

Hackathon project — see repository owner for usage terms.
