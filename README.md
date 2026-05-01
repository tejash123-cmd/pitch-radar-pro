# Pitch Radar Pro

Pitch Radar Pro is an AI-powered startup diligence workspace that helps venture teams turn a pitch deck (PDF/PPTX) plus meeting notes into:

- Market novelty insights
- Technology trajectory cues
- Multi-scenario foresight analysis
- Startup fit-vs-future evaluation

The app combines a modern React frontend with a Python backend that orchestrates retrieval, parsing, and LLM-driven synthesis.

## MVP Overview

The current MVP is built to answer one practical workflow:

1. Upload a startup deck
2. Add optional notes/context
3. Run analysis
4. Review structured outputs in dashboard tabs:
   - VC Memory
   - Novelty Market Analysis
   - Foresight Market Analysis

### What the MVP includes

- Frontend upload + analysis flow
- Backend compatibility endpoint for frontend scoring (`/score-startup`)
- Foresight pipeline with:
  - briefing parsing
  - evidence retrieval
  - trajectory statistics
  - scenario generation
  - startup-vs-scenario fit synthesis
- Friendly error handling for common LLM issues (including OpenRouter 429/rate limits)
- Health endpoint (`/health`)

### What is still MVP/early stage

- Retrieval quality and evidence relevance can vary by startup/domain
- Scenario output quality depends heavily on LLM key/model/quota
- Some advanced backend routes exist but may need additional UX hardening

## Tech Stack

### Frontend

- React 19 + TypeScript
- TanStack Router / Start
- Vite
- Tailwind CSS + UI components

### Backend

- Python + Flask
- Flask-CORS
- LLM providers:
  - OpenRouter
  - Gemini
- Supporting modules for parsing, retrieval, trajectory analysis, and report generation

## Project Structure

- `src/` - frontend app, routes, UI components, adapters
- `app.py` - Flask backend entrypoint and API routes
- `modules/` - backend domain logic (parsing, retrieval, foresight, fit, storage)
- `data/` - local runtime data store (local state/persistence)
- `db/` - database docs/assets
- `requirements.txt` - Python backend dependencies

## API Endpoints (key)

- `GET /health` - backend health check
- `POST /score-startup` - frontend scoring/analysis endpoint (deck upload + response for dashboard)
- `POST /api/analyze` - richer authenticated analysis route
- `POST /api/chat` - chat against foresight context
- `GET /api/runs` - list saved runs
- `GET /api/runs/<run_id>` - run details

## Environment Variables

Create `.env` in project root. Example baseline:

```env
VITE_API_BASE_URL=http://127.0.0.1:5051
PORT=5051

# LLM (at least one required for meaningful generation)
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=poolside/laguna-xs.2:free

# Optional Gemini fallback
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-2.0-flash

SESSION_SECRET=change-me-in-production
```

## Local Setup

## 1) Install frontend deps

```bash
npm install
```

## 2) Install backend deps

```bash
python -m pip install -r requirements.txt
```

On Windows, if `python` alias fails, use:

```powershell
py -m pip install -r requirements.txt
```

## 3) Run backend

```bash
python app.py
```

Windows fallback:

```powershell
py app.py
```

Backend should be available at:

- `http://127.0.0.1:5051/health`

## 4) Run frontend

```bash
npm run dev
```

## 5) Build check

```bash
npm run build
```

## NPM Scripts

- `npm run dev` - start frontend dev server
- `npm run build` - production build
- `npm run lint` - lint frontend
- `npm run format` - format repo
- `npm run backend:deps` - install backend Python deps
- `npm run backend:start` - start backend via `python app.py`

## Typical Analysis Input (recommended)

For best foresight quality, include:

- Startup name
- One-line pitch
- Problem statement
- Product/technology details
- Target customer + geography
- Business model
- Current traction
- Competitors
- Key risks

More context generally improves scenario quality.

## Known Issues / Troubleshooting

### "Failed to fetch" from frontend

- Ensure backend is running
- Ensure `VITE_API_BASE_URL` points to backend URL/port
- Verify `GET /health` returns `{"status":"ok"}`

### OpenRouter HTTP 429 (rate limit)

- Free tier quota is exhausted
- Wait for quota reset, add credits, switch model, or provide `GEMINI_API_KEY`
- App falls back to recovery messaging, but scenario quality will degrade during throttling

### Python command not found on Windows

- Use `py` launcher instead of `python`
- Disable Microsoft Store app execution aliases for `python.exe`/`python3.exe` if needed

## Security Notes

- Do not commit `.env` or API keys
- Keep runtime local store data out of commits when it contains local secrets/state
- Review staged files before push

## Current MVP Goal

Deliver a practical, fast first-pass investment intelligence tool for founders and venture teams:

- ingest startup materials quickly
- generate evidence-backed scenario thinking
- highlight risks, opportunities, and diligence next steps

This repo is the working MVP baseline for iterative improvements to retrieval quality, scenario realism, and decision support UX.
