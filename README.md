# LangGraph Finance Demo

A local workshop demo that uses LangGraph, FastAPI, React, and Yahoo Finance data to stress-test financing terms for a venture-style cap table.

The goal is to make agent orchestration concrete: LangGraph owns the workflow, a market-data tool loads public comps, deterministic Python code performs the finance math, and the dashboard shows each node in the trace.

## What is included

- `backend/` - FastAPI app, LangGraph workflow, Yahoo Finance integration, deterministic cap table model, and Python tests.
- `frontend/` - Vite/React dashboard with assumption controls, charts, market cards, and an animated graph trace.
- `deck/` - Self-contained HTML workshop deck, speaker notes, screenshots, and verification video.
- `scripts/capture-demo.mjs` - Playwright capture script for refreshing deck screenshots and video.

## Prerequisites

- Node.js 20 or newer
- Python 3.13
- `ffmpeg` if you want to regenerate the deck verification video

## Setup

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
npm install
```

## Run the demo

Start the API:

```bash
source .venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```

In another terminal, start the dashboard:

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

The frontend calls `http://127.0.0.1:8000` by default. To point it at a different API, set `VITE_API_URL` before starting Vite.

## Data behavior

The backend attempts to load quote data through `yfinance`. If Yahoo Finance is unavailable, throttled, or offline, the app automatically falls back to deterministic cached quotes and records that path in the result.

The frontend also includes a presentation-safe fallback result so the dashboard remains usable during rehearsal even if the local API is not running.

## Verify

With the Python virtual environment activated:

```bash
npm test
npm run build
```

You can also run each suite separately:

```bash
npm run test:frontend
npm run test:backend
```

`npm run build` may report a Vite chunk-size warning because the workshop dashboard bundles Recharts. That warning is expected for this demo.

## Workshop deck

Open `deck/index.html` in a browser for the slide deck. Speaker notes live in `deck/SPEAKER_NOTES.md`.

The committed assets in `deck/assets/` make the deck work immediately from GitHub. To refresh those screenshots and the verification video after UI changes:

```bash
source .venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
npm run dev
node scripts/capture-demo.mjs
```

The capture script expects the dashboard at `http://127.0.0.1:5173`.

## Troubleshooting

- `pytest: command not found`: activate `.venv` and run `pip install -r backend/requirements.txt`.
- Backend import errors in tests: run tests through the npm scripts or set `PYTHONPATH=backend`.
- Empty live market data: the cached quote path should keep the demo running; check the data source label in the dashboard.
- Browser cannot reach the API: confirm `uvicorn` is running on port `8000`, or set `VITE_API_URL` for a custom backend URL.

## License

MIT
