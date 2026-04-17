# LLM-powered-personalized-travel-itinerary-planner

Full-stack AI travel planner with:
- secure user authentication (JWT + bcrypt)
- strict per-user trip isolation
- AI-generated itinerary + budget + hotel suggestions
- editable itinerary actions (add/remove activity, regenerate a day)
- custom feature: AI packing checklist based on destination/interests

## Tech Stack
- Frontend: Next.js (App Router) + Tailwind CSS + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB (Mongoose)
- LLM: OpenAI API (`OPENAI_API_KEY`) with safe fallback generator if key is missing

## Project Structure
```text
ai-trip-planner/
├── client/
├── server/
├── render.yaml
└── README.md
```

## Local Setup

### 1) Backend
```bash
cd server
cp .env.example .env
# fill values: MONGO_URI, JWT_SECRET, optional OPENAI_API_KEY
npm install
npm run dev
```
Backend runs on `http://localhost:8080`.

### 2) Frontend
```bash
cd client
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8080
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

## API Endpoints

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Trips (all protected with Bearer token):
- `POST /api/trips` create trip from user input + AI generation
- `GET /api/trips` list current user's trips only
- `GET /api/trips/:id` get one trip owned by current user
- `POST /api/trips/:id/activities` add activity to a day
- `DELETE /api/trips/:id/activities` remove activity from a day
- `POST /api/trips/:id/regenerate-day` regenerate one day with instruction

## Data Isolation and Security
- JWT required on all trip routes
- Queries enforce ownership via `userId` on every trip read/write
- Passwords are hashed with bcrypt
- Invalid/expired tokens return `401`

## Creativity Feature
Packing checklist generation is included for each trip.

Why:
- solves a real planning gap after itinerary creation
- uses same trip context (destination, budget, interests) for personalized travel preparation
- adds practical value with very low user effort

## Deployment (Mandatory)

I cannot log into your cloud accounts. You connect GitHub and set environment variables in each dashboard. The repo is set up so you only pick root folders and paste values.

### Order: backend first, then frontend

1. Deploy **API on Railway** → copy the public URL (e.g. `https://your-api.up.railway.app`).
2. Deploy **Next.js on Vercel** → set `NEXT_PUBLIC_API_URL` to that Railway URL **without a trailing slash** (e.g. `https://your-api.up.railway.app`).
3. In Railway, set **`CLIENT_ORIGIN`** to your Vercel URL (e.g. `https://your-app.vercel.app`). For multiple origins, use commas: `https://app.vercel.app,http://localhost:3000`.

### Backend (Railway)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub → select this repo.
2. Add a **Web** service → **Settings → Root Directory** → `server`.
3. **Variables** (minimum):
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — long random string
   - `CLIENT_ORIGIN` — your Vercel site URL (see above)
4. Optional: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` (see `server/.env.example`).
5. Deploy. `server/railway.toml` sets build/start and `/health` check.

Public API base = Railway URL. Health check: `https://<your-railway-host>/health`.

### Frontend (Vercel)

1. [vercel.com](https://vercel.com) → Add New Project → import the same GitHub repo.
2. **Root Directory** → `client`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://<your-railway-host>` (no path suffix)
4. Deploy.

### Backend (Render) — optional

`render.yaml` is still valid if you prefer Render instead of Railway; steps are similar (set `CLIENT_ORIGIN` to the Vercel URL).

## Production Notes
- Keep secrets only in deployment env settings (never commit `.env`).
- CORS is controlled by `CLIENT_ORIGIN`.
- OpenAI key is optional: app remains functional with deterministic fallback itinerary generation.
