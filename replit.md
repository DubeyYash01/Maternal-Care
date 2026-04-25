# Project

Vite + React + TypeScript + shadcn/ui maternal-health monitoring SPA with a server-side AI analysis route.

## Setup
- Dev server: `npm run dev` on port 5000 (host 0.0.0.0, allowedHosts true) via the "Start application" workflow.
- Build: `npm run build` -> `dist/`
- Production server: `npm run start` (= `tsx server/server.ts`) — serves `dist/` statically AND mounts `/api/*` routes (analyze, ai-status, alert-history, send-alert) on port `$PORT` (default 5000).
- Deployment: autoscale, build `npm run build`, run `npm run start`.

## Architecture
- **Frontend**: `src/` — Landing page (`src/pages/Landing.tsx`) is the premium showcase with hero, dashboard, AI panel, etc. Realtime sensor values come from Firebase via `src/hooks/useRealtimeSensors.ts`.
- **Server**: `server/` — Same handlers shared between dev and prod.
  - In dev: `server/api-plugin.ts` (Vite plugin) mounts the routes on the Vite middleware.
  - In prod: `server/server.ts` (plain Node `http`) serves the built SPA from `dist/` plus the same routes. SPA fallback to `index.html` for unknown non-`/api` paths. Long-cache for `/assets/*`, no-cache for `index.html`.
  - `server/risk.ts` — **professional weighted clinical engine**. Per-metric impacts (HR ≤25, SpO₂ ≤35, Temp ≤20, Resp ≤15, Offline 30, Movement ≤10) with banded thresholds. Multi-parameter combination bonuses, ECG intelligence (lead-off, PPG mismatch, flat trace), single + combined alert lists, sensor reliability summary. Status: Excellent / Stable / Monitor Closely / High Risk / Critical. Offline floors level to "Monitor Closely".
  - `server/analyze.ts` — receives live vitals + ECG + mic + history, computes deterministic risk, asks Gemini (`gemini-2.5-flash` REST with `thinkingBudget: 0`) for `summary`, `recommendations[]`, `report`, `severity`, `combinedFindings[]`, `trend`. **Retries once** on transient errors (5xx/429/timeout/network). On any failure, returns local failsafe with `userMessage: "AI service temporarily unavailable"`. Exports `isGeminiConfigured()` and `checkGeminiKeyOnStartup()` (logs `Gemini API key missing` if absent). Then evaluates the alert engine and (maybe) dispatches email.
  - `GET /api/ai-status` — health check returning `{ status: "ok", gemini: boolean, model, timestamp }`.
  - `server/alerts.ts` — tier engine: Moderate (≥65), High (≥75), Critical (≥80). Anti-spam: only sends on first entry to a tier, on tier escalation, on score worsening ≥8 within same tier, or every 15 min while critical. Resets after score < 60 sustained 10 min. Keeps in-memory history (last 50).
  - `server/email.ts` — Nodemailer + Gmail SMTP. Three branded email templates (Moderate/High/Critical) with HTML + plain text, includes Gemini summary as "AI Note", and ships to 4 hardcoded caregiver addresses.

## Secrets
- `GEMINI_API_KEY` is read **server-side only** by `server/analyze.ts`. It is never exposed to the browser.
- `GMAIL_USER` + `GMAIL_APP_PASSWORD` are used by `server/email.ts` for SMTP. The app password must be a Google App Password (16 chars, no spaces) generated at https://myaccount.google.com/apppasswords with 2-Step Verification enabled.
- `VITE_FIREBASE_*` keys configure the Firebase client SDK in `src/lib/firebase.ts`.

## Premium 3D Futuristic UI (Apr 2026)
- **`src/components/3d/SmartBelt3D.tsx`** — R3F Canvas: glass dome torus belt, Distort sensor sphere, floating data nodes, Sparkles, pulse rings, mouse parallax via `useFrame`.
- **`src/components/3d/SafeBelt3D.tsx`** — wraps SmartBelt3D with WebGL feature detection + Error Boundary + Suspense. Falls back to the CSS `SmartBelt` if WebGL is unavailable (sandboxes, low-end hardware) so the page never crashes.
- **`src/components/TiltCard.tsx`** — framer-motion 3D tilt with spring rotateX/rotateY for feature + future cards.
- **`src/components/RiskGauge.tsx`** — animated SVG arc gauge.
- **`src/components/AlertTimeline.tsx`** — fetches `/api/alert-history` and renders a glass timeline with tier color coding.
- **`src/components/Navigation.tsx`** — glass nav with deeper blur on scroll, IntersectionObserver section highlighting w/ framer `layoutId` pill, animated logo, mobile AnimatePresence menu.
- **CSS utilities in `src/index.css`**: `.holo-border`, `.glow-border-hover`, `.grid-3d`, `.scan-line`, plus `holoShift`/`scan` keyframes.
- **`src/pages/Landing.tsx`** lazy-loads 3D and uses `useIsMobile` to skip R3F entirely on mobile (CSS belt instead).

## AI Insight panel (`src/components/AIInsightPanel.tsx`)
Sits inside the Live Dashboard section. Triggers `/api/analyze` on:
1. First time live vitals appear
2. Every 60 seconds (poll)
3. Significant local-score change (≥15 points) or risk-level change (throttled at 6s minimum gap)
4. Manual "Analyze" button click
