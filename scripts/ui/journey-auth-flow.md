# Journey: Auth Flow

Status: Phase 3 executable

Goal
- Validate auth entry and callback behavior in a deterministic way.

Execution
1. Open `/auth` and assert "Sign in with Discord" heading renders.
2. Open `/auth/callback?code=ui-harness-code`.
3. Assert redirect back to `/`.

Key API calls tracked
- `GET /api/user`

Artifacts
- `screenshot.png`
- `dom-snapshot.json`
- `console.json`
- `network.json`
- `performance-metrics.json`
- `trace.zip`
