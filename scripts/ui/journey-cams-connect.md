# Journey: Cams Connect

Status: Phase 3 executable

Goal
- Validate cams list loads and connect dialog controls render.

Execution
1. Open `/cams`.
2. Assert a seller card is visible.
3. Click seller card and assert connect dialog renders "charges" and dial controls.

Key API calls tracked
- `GET /api/chat/online-users`
- `GET /api/user/:id`

Artifacts
- `screenshot.png`
- `dom-snapshot.json`
- `console.json`
- `network.json`
- `performance-metrics.json`
- `trace.zip`
