# UI Legibility Plan

## Phase 3 status
- `./scripts/ci ui` executes three journeys end-to-end.
- Artifacts are written to `artifacts/ui/<journey>/<timestamp>/`.
- Run summary is written to:
  - `artifacts/ui/report-<timestamp>.md`
  - `artifacts/ui/report-<timestamp>.json`

## Journeys
- Auth flow (`scripts/ui/journey-auth-flow.md`)
- Feed view (`scripts/ui/journey-feed-view.md`)
- Cams connect (`scripts/ui/journey-cams-connect.md`)

## Artifacts per journey
- `screenshot.png`
- `dom-snapshot.json` (CDP `DOMSnapshot.captureSnapshot`)
- `console.json` (warnings/errors + page errors)
- `network.json` (request failures, 4xx/5xx, key API calls)
- `performance-metrics.json` (CDP `Performance.getMetrics`)
- `trace.zip` (browser trace)
- `result.json`

## Runtime controls
- `UI_BASE_URL` (default: `http://127.0.0.1:3000`)
- `UI_AUTOSTART` (`1` by default; auto-starts frontend dev server if needed)
- `UI_MOCK_API` (`1` by default for deterministic journeys)
- `UI_BROWSER_PATH` (optional explicit Chrome/Chromium path)
- `UI_JOURNEYS` (comma-separated journey ids for partial runs)

## CI rollout mode
- Non-blocking workflow: `.github/workflows/ui-legibility.yml`
- Triggers:
  - PR label `ui-check`
  - nightly schedule
  - manual dispatch
