# David J. Gorelashvili — Developer Portfolio

> **Python backend engineer** building production-style APIs, data pipelines, and React frontends.  
> This repository is a full-stack portfolio: a **FastAPI** backend with four interactive demo projects, paired with a **React 19 + Vite** SPA designed for real devices.

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## Table of Contents

- [Overview](#overview)
- [Why this repo matters](#why-this-repo-matters)
- [Featured projects](#featured-projects)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Frontend highlights](#frontend-highlights)
- [Development workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contact](#contact)
- [Deployment](#deployment)

---

## Overview

This portfolio showcases end-to-end software development: REST API design, authentication, third-party integrations, concurrent web scraping, SQLite persistence, and a polished responsive UI.

| | |
|---|---|
| **Author** | David J. Gorelashvili |
| **Focus** | Backend development (Python / FastAPI) with full-stack delivery |
| **Location** | Israel — open to junior backend roles |
| **Repository** | [github.com/dato7777/Portfolio](https://github.com/dato7777/Portfolio) |

The site includes a cinematic home page, an about section, project demos, JWT-protected user stats, and a contact page — all wired to a single FastAPI application.

---

## Concrete Skills Used:


- **API design** — Modular FastAPI routers, Pydantic validation, OpenAPI docs at `/docs`
- **Security** — JWT authentication with password hashing (`passlib`) and protected routes
- **External services** — OpenAI question generation, OpenWeather data, RapidAPI geocoding
- **Data engineering** — Multi-scraper grocery price comparison with price history stored in SQLite
- **Full-stack polish** — React 19 SPA with Framer Motion, Tailwind CSS, and a responsive nav (mobile bottom dock + desktop left rail)
- **Real-world patterns** — Lifespan hooks for DB init, CORS configuration, concurrent HTTP with `httpx` / `aiohttp`

---

## Featured projects

Each project has a dedicated UI route under `/projects/*` and corresponding backend endpoints.

### QuizProAI — `/projects/quizproai`

AI-powered quiz application with user accounts and performance tracking.

| | |
|---|---|
| **What it does** | Generates category-based quiz questions via OpenAI, tracks per-user stats, supports login/register |
| **Backend** | JWT auth, SQLModel ORM, SQLite (`quiz.db`) |
| **Frontend** | Protected routes, animated quiz flow, user stats dashboard |
| **Key APIs** | `/auth/*`, `/quizproai/*`, `/quiz/stats/*` |

### Weather Lab — `/projects/weather`

Global weather explorer with continent extremes and city search.

| | |
|---|---|
| **What it does** | Shows hottest/coldest cities per continent, searches any city, visualizes data on an interactive 3D globe |
| **Backend** | OpenWeather API + RapidAPI geocoding, `pycountry` for continent mapping |
| **Frontend** | React Three Fiber globe, smooth scroll between continent/city modes |
| **Key APIs** | `/weather/*` |

### Buy Smart — `/projects/buysmart`

Grocery price comparison across Israeli online supermarkets.

| | |
|---|---|
| **What it does** | Searches products concurrently across scrapers, compares prices, stores and charts price history |
| **Backend** | Concurrent scrapers (`httpx`), dedicated SQLite DB (`buy_smart.db`), history API |
| **Frontend** | Live search, category browser, price history charts |
| **Key APIs** | `/scrapers/*`, `/prices/history` |

### Smart File Organizer — `/projects/smartfileorganizer`

Desktop-style file sorting exposed through the web UI.

| | |
|---|---|
| **What it does** | Upload a folder; backend organizes files by type and date, returns a downloadable ZIP |
| **Backend** | Multipart upload, filesystem operations, custom response headers for stats |
| **Key APIs** | `/file-organizer/*` |

---

## Architecture

```mermaid
flowchart TB
    subgraph Client["React SPA (Vite · port 5173)"]
        Home[Home / About / Contact]
        Projects[Project demos]
        Auth[JWT client storage]
    end

    subgraph API["FastAPI (port 8000)"]
        Quiz[QuizProAI + Auth]
        Weather[Weather Lab]
        BuySmart[Buy Smart scrapers]
        Files[File Organizer]
    end

    subgraph Data["Persistence"]
        QuizDB[(quiz.db)]
        BuyDB[(buy_smart.db)]
    end

    subgraph External["Third-party APIs"]
        OpenAI[OpenAI]
        OWM[OpenWeather]
        Rapid[RapidAPI Geocoding]
        Stores[Supermarket sites]
    end

    Client -->|REST / JSON| API
    Quiz --> QuizDB
    BuySmart --> BuyDB
    Quiz --> OpenAI
    Weather --> OWM
    Weather --> Rapid
    BuySmart --> Stores
```

**Request flow:** The React app reads `VITE_API_URL` (defaults to `http://127.0.0.1:8000` locally). CORS allows localhost plus `FRONTEND_URL` / `ALLOWED_ORIGINS` from env. Database tables are created automatically on startup via FastAPI lifespan hooks.

---

## Tech stack

### Backend

| Category | Technologies |
|----------|-------------|
| Framework | FastAPI, Uvicorn |
| ORM / DB | SQLModel, SQLite |
| Auth | python-jose (JWT), passlib |
| HTTP / scraping | httpx, aiohttp, requests |
| AI | OpenAI Python SDK |
| Validation | Pydantic v2 |

### Frontend

| Category | Technologies |
|----------|-------------|
| Core | React 19, React Router 7 |
| Build | Vite 6 |
| Styling | Tailwind CSS 3, custom responsive layout utilities |
| Animation | Framer Motion |
| 3D | Three.js, React Three Fiber, Drei |
| HTTP | Axios |

---

## Repository structure

```
NewPortfolio2/
├── backend_portfolio/
│   ├── main.py                 # FastAPI app, CORS, router registration, DB lifespan
│   ├── db.py                   # QuizProAI SQLite engine
│   ├── buy_smart_db.py         # Buy Smart SQLite engine
│   ├── requirements.txt        # Pinned Python dependencies
│   ├── .env.example            # Environment variable template (copy to .env)
│   └── routers/Projects/
│       ├── quizProAI/          # Auth, quiz generation, stats
│       ├── weather/            # OpenWeather + geocoding
│       ├── buy_smart/          # Scrapers, price compare, history
│       └── file_organizer/     # Upload & organize files
│
└── frontend_portfolio/
    ├── src/
    │   ├── pages/              # home, about, contact, project demos
    │   ├── components/         # Navbar, LetterReveal, MiniGlobe, …
    │   ├── config/api.js         # VITE_API_URL (shared API base)
    │   └── api/client.js       # Axios instance
    ├── tailwind.config.js      # Custom `nav: 960px` breakpoint
    └── package.json
```

---

## Getting started

### Quick start

```bash
git clone https://github.com/dato7777/Portfolio.git && cd Portfolio

# Backend
python3 -m venv backend_portfolio/venv
source backend_portfolio/venv/bin/activate
pip install -r backend_portfolio/requirements.txt
cp backend_portfolio/.env.example backend_portfolio/.env   # then edit with your API keys
uvicorn backend_portfolio.main:app --reload

# Frontend (new terminal)
cd frontend_portfolio && npm install && npm run dev
```

Open **http://localhost:5173** · API docs at **http://127.0.0.1:8000/docs**

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** and npm
- API keys for the features you want to test (see [Environment variables](#environment-variables))

### 1. Clone the repository

```bash
git clone https://github.com/dato7777/Portfolio.git
cd Portfolio
```

### 2. Backend setup

```bash
python3 -m venv backend_portfolio/venv
source backend_portfolio/venv/bin/activate          # Windows: backend_portfolio\venv\Scripts\activate
pip install -r backend_portfolio/requirements.txt
cp backend_portfolio/.env.example backend_portfolio/.env
```

Edit `backend_portfolio/.env` with your API keys, then from the **repository root** (with venv activated):

```bash
uvicorn backend_portfolio.main:app --reload
```

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:8000 |
| Swagger UI | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |

SQLite databases (`quiz.db`, `buy_smart.db`) are created automatically on first startup.

### 3. Frontend setup

```bash
cd frontend_portfolio
npm install
npm run dev
```

App runs at **http://localhost:5173**

### 4. Run both (recommended)

Use two terminals — backend on port `8000`, frontend on port `5173` — then browse to the frontend URL.

---

## Environment variables

Copy the template and fill in your keys:

```bash
cp backend_portfolio/.env.example backend_portfolio/.env
```

`backend_portfolio/.env`:

```env
DATABASE_URL=postgresql://postgres.xxxx:YOUR_PASSWORD@....supabase.com:5432/postgres
OPENAI_API_KEY=sk-...
OPENWEATHER_API_KEY=...
RAPIDAPI_KEY=...
JWT_SECRET_KEY=your-long-random-secret
```

| Variable | Used by | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | QuizProAI | Yes, for AI quizzes |
| `OPENWEATHER_API_KEY` | Weather Lab | Yes, for weather data |
| `RAPIDAPI_KEY` | Weather Lab | Yes, for city geocoding |
| `JWT_SECRET_KEY` | Auth | Recommended (dev default exists) |
| `DATABASE_URL` | QuizProAI + Buy Smart (Supabase Postgres) | Yes for persistent data |
| `BUY_SMART_DATABASE_URL` | Buy Smart only | Optional (defaults to `DATABASE_URL`) |
| `SQLITE_PATH` / `BUY_SMART_SQLITE_PATH` | Local SQLite fallback | Only if `DATABASE_URL` unset |

**Where to get keys**

| Service | Sign up |
|---------|---------|
| Supabase (Postgres) | [supabase.com](https://supabase.com) → Project Settings → Database → URI |
| OpenAI | [platform.openai.com](https://platform.openai.com/) |
| OpenWeather | [openweathermap.org/api](https://openweathermap.org/api) |
| RapidAPI (geocoding) | [rapidapi.com](https://rapidapi.com/) |

> **Note:** Never commit `.env` files. Only `.env.example` belongs in git.

---

## API overview

| Prefix | Module | Key endpoints |
|--------|--------|---------------|
| `/auth` | QuizProAI | `POST /signup`, `POST /login` |
| `/quizproai` | QuizProAI | `POST /generate-questions/` |
| `/quiz` | QuizProAI | `GET /stats/me`, `POST /stats/event` |
| `/weather` | Weather Lab | `GET /extremes/{continent}`, `GET /city` |
| `/scrapers` | Buy Smart | `GET /search`, `GET /sources`, `GET /getCategories` |
| `/prices` | Buy Smart | `GET /history` |
| `/file-organizer` | File Organizer | `POST /organize-zip`, `POST /organize-folder` |

Full request/response schemas: **http://127.0.0.1:8000/docs** (Swagger UI) and **http://127.0.0.1:8000/redoc**.

---

## Frontend highlights

- **Responsive by design** — Mobile bottom navigation dock; desktop left-edge rail from 960px (`nav` breakpoint)
- **Animated home page** — Letter-by-letter bio reveal, skill bento grid, dark cinematic layout
- **Project-first navigation** — Each demo is a self-contained route with tailored UI
- **Auth-aware routing** — QuizProAI stats require a valid JWT from `/auth/login`

To build for production:

```bash
cd frontend_portfolio
npm run build
npm run preview
```

---

## Development workflow

| Task | Command |
|------|---------|
| Start backend (hot reload) | `uvicorn backend_portfolio.main:app --reload` |
| Start frontend (HMR) | `cd frontend_portfolio && npm run dev` |
| Lint frontend | `cd frontend_portfolio && npm run lint` |
| Reinstall backend deps | `pip install -r backend_portfolio/requirements.txt` |
| Explore API interactively | Open http://127.0.0.1:8000/docs |

**Suggested review order for employers**

1. `backend_portfolio/main.py` — app entry, router wiring, DB lifespan
2. `backend_portfolio/routers/Projects/quizProAI/` — auth + OpenAI integration
3. `backend_portfolio/routers/Projects/buy_smart/` — concurrent scrapers + price history
4. `frontend_portfolio/src/pages/home.jsx` — UI craft and responsive layout

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: backend_portfolio` | Run `uvicorn` from the **repository root**, not inside `backend_portfolio/` |
| CORS errors in browser | Ensure backend is on port `8000` and frontend on `5173` (matches CORS config in `main.py`) |
| QuizProAI returns 500 | Check `OPENAI_API_KEY` in `backend_portfolio/.env` |
| Weather returns missing API key | Set `OPENWEATHER_API_KEY` and `RAPIDAPI_KEY` in `.env` |
| Buy Smart search empty | Scrapers depend on live supermarket sites; try query `חלב` or browse categories |
| Frontend can't reach API | Set `VITE_API_URL` in `frontend_portfolio/.env.local` (dev) or Vercel env (prod). See [DEPLOY.md](DEPLOY.md) |

---

## Deployment

Deploy the **React app to Vercel** and the **FastAPI API to Render**:

- Full guide: **[DEPLOY.md](DEPLOY.md)**
- Backend blueprint: `render.yaml` (Render Web Service + persistent disk)
- Frontend SPA routing: `frontend_portfolio/vercel.json`
- Env templates: `backend_portfolio/.env.example`, `frontend_portfolio/.env.example`

Quick production env vars:

| Platform | Variable | Example |
|----------|----------|---------|
| Vercel | `VITE_API_URL` | `https://portfolio-api.onrender.com` |
| Render | `DATABASE_URL` | Supabase Postgres URI |
| Render | `FRONTEND_URL` | `https://your-app.vercel.app` |

---

## Contact

| | |
|---|---|
| **GitHub** | [@dato7777](https://github.com/dato7777) |
| **LinkedIn** | [David J. Gorelashvili](https://www.linkedin.com/in/david-j-gorelashvili-696aa9109/) |
| **Email** | [david613jacob@gmail.com](mailto:david613jacob@gmail.com) |

If you're reviewing this repo for a role: start with **QuizProAI** and **Buy Smart** — they best demonstrate backend depth (auth, AI integration, concurrent scraping, and persistence). The home page and `/projects` route give a quick overview of scope and UI craft.

---

<p align="center">
  Built with Python, FastAPI, and React · © David J. Gorelashvili
</p>
