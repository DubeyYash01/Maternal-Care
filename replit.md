# Project

Vite + React + TypeScript + shadcn/ui maternal-health monitoring SPA with a server-side AI analysis route.

## Setup
- Dev server: `npm run dev` on port 5000 (host 0.0.0.0, allowedHosts true) via the "Start application" workflow.
- Build: `npm run build` -> `dist/`
- Deployment: autoscale, build `npm run build`, run `npm run preview` (serves built files + the same `/api/analyze` middleware).

## Architecture
- **Frontend**: `src/` — Landing page (`src/pages/Landing.tsx`) is the premium showcase with hero, dashboard, AI panel, etc. Realtime sensor values come from Firebase via `src/hooks/useRealtimeSensors.ts`.
- **Server middleware**: `server/` — A small Vite plugin (`server/api-plugin.ts`) mounts a `POST /api/analyze` handler in both `vite dev` and `vite preview`, so no separate Express server is needed.
  - `server/risk.ts` — **professional weighted clinical engine**. Per-metric impacts (HR ≤25, SpO₂ ≤35, Temp ≤20, Resp ≤15, Offline 30, Movement ≤10) with banded thresholds matching standard adult wellness ranges. Multi-parameter combination bonuses (Low SpO₂+High HR, Fever+High HR, Low SpO₂+High Resp, Offline+abnormal). Movement intelligence uses recent FSR history variance/spikes. Status labels: Excellent / Stable / Monitor Closely / High Risk / Critical. Offline floors level to "Monitor Closely".
  - `server/analyze.ts` — receives live vitals + movement history, computes the deterministic risk, then asks Gemini (`gemini-2.5-flash` via REST, with `thinkingConfig: { thinkingBudget: 0 }` for fast structured JSON) for short wellness-style summary/recommendation/trend. Never re-scores. Falls back to a local summary if Gemini fails or `GEMINI_API_KEY` is absent.

## Secrets
- `GEMINI_API_KEY` is read **server-side only** by `server/analyze.ts`. It is never exposed to the browser.
- `VITE_FIREBASE_*` keys configure the Firebase client SDK in `src/lib/firebase.ts`.

## AI Insight panel (`src/components/AIInsightPanel.tsx`)
Sits inside the Live Dashboard section. Triggers `/api/analyze` on:
1. First time live vitals appear
2. Every 60 seconds (poll)
3. Significant local-score change (≥15 points) or risk-level change (throttled at 6s minimum gap)
4. Manual "Analyze" button click
