# Deploy to Vercel + Render

Step-by-step guide to put the portfolio online using **Vercel** (frontend) and **Render** (backend).

---

## Before you start

1. Code is on GitHub: [github.com/dato7777/Portfolio](https://github.com/dato7777/Portfolio)
2. You have API keys: OpenAI, OpenWeather, RapidAPI
3. Optional: use a `staging` branch first, then merge to `main` for production

---

## Part 1 — Deploy backend (Render)

### Option A: Blueprint (recommended)

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect repo `dato7777/Portfolio`
3. Render reads `render.yaml` at the repo root
4. When prompted, set these **secret** env vars:
   - `OPENAI_API_KEY`
   - `OPENWEATHER_API_KEY`
   - `RAPIDAPI_KEY`
   - `FRONTEND_URL` — leave blank for now; add your Vercel URL after Part 2
5. Click **Apply** and wait for deploy
6. Note your API URL, e.g. `https://portfolio-api.onrender.com`
7. Test: open `https://portfolio-api.onrender.com/health` → should return `{"status":"ok"}`
8. API docs: `https://portfolio-api.onrender.com/docs`

### Option B: Manual Web Service

| Setting | Value |
|---------|--------|
| **Root Directory** | *(blank — repo root)* |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r backend_portfolio/requirements.txt` |
| **Start Command** | `uvicorn backend_portfolio.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |

**Environment variables** (Render → Environment):

```env
OPENAI_API_KEY=sk-...
OPENWEATHER_API_KEY=...
RAPIDAPI_KEY=...
JWT_SECRET_KEY=<long-random-string>
FRONTEND_URL=https://your-app.vercel.app
SQLITE_PATH=/data/quiz.db
BUY_SMART_SQLITE_PATH=/data/buy_smart.db
```

**Persistent disk** (required so SQLite survives redeploys):

- Mount path: `/data`
- Size: 1 GB

---

## Part 2 — Deploy frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `dato7777/Portfolio`
3. Configure:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend_portfolio` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. **Environment Variables** → add:

```env
VITE_API_URL=https://portfolio-api.onrender.com
```

Use your actual Render URL. **No trailing slash.**

5. Deploy
6. Note your Vercel URL, e.g. `https://portfolio-xyz.vercel.app`

---

## Part 3 — Connect frontend and backend

1. **Render** → your service → **Environment**
2. Set `FRONTEND_URL` to your Vercel URL:

```env
FRONTEND_URL=https://portfolio-xyz.vercel.app
```

Or comma-separated list:

```env
ALLOWED_ORIGINS=https://portfolio-xyz.vercel.app,https://your-custom-domain.com
```

3. **Manual Deploy** or wait for auto-redeploy on Render
4. **Vercel** → redeploy if you changed `VITE_API_URL` (env vars apply on next build)

---

## Part 4 — Verify

| Check | URL / action |
|-------|----------------|
| API health | `https://YOUR-API.onrender.com/health` |
| Swagger | `https://YOUR-API.onrender.com/docs` |
| Home page | `https://YOUR-APP.vercel.app` |
| QuizProAI | Register → login → start quiz |
| Weather | Search a city |
| Buy Smart | Search products |
| DevTools Network | Requests go to Render URL, not `127.0.0.1` |

---

## Staging vs production

| Branch | Render service | Vercel |
|--------|----------------|--------|
| `staging` | Second Render web service (or change `branch` in `render.yaml`) | Preview deploy from `staging` |
| `main` | Production API | Production site |

Use separate env vars per environment (`FRONTEND_URL`, `VITE_API_URL`).

---

## Local development (unchanged)

```bash
# Backend
cp backend_portfolio/.env.example backend_portfolio/.env
# edit .env with your keys
uvicorn backend_portfolio.main:app --reload

# Frontend
cp frontend_portfolio/.env.example frontend_portfolio/.env.local
npm run dev
```

Default `VITE_API_URL=http://127.0.0.1:8000` works without changes.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Set `FRONTEND_URL` on Render to exact Vercel URL (https, no trailing slash) |
| API calls still go to localhost | Set `VITE_API_URL` on Vercel and **redeploy** frontend |
| 502 / slow first request | Render free tier sleeps; first hit wakes the service (~30–60s) |
| Database empty after redeploy | Attach persistent disk at `/data` and set `SQLITE_PATH` / `BUY_SMART_SQLITE_PATH` |
| Buy Smart no results | Scrapers may block cloud IPs; works locally but not always on Render |
| React routes 404 on refresh | `frontend_portfolio/vercel.json` rewrites all paths to `index.html` |

---

## Custom domain (optional)

- **Vercel:** Project → Settings → Domains
- **Render:** Service → Settings → Custom Domain (e.g. `api.yourdomain.com`)
- Update `VITE_API_URL` and `FRONTEND_URL` / `ALLOWED_ORIGINS` to match
