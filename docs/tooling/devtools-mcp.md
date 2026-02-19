# DevTools MCP Setup

This repo uses two complementary browser paths:
- `./scripts/ci ui`: deterministic scripted journeys that generate CI artifacts.
- DevTools MCP server: interactive browser debugging for Codex agent loops.

## 1. Configure DevTools MCP in Codex

Edit `~/.codex/config.toml` and add:

```toml
[mcp_servers.chrome_devtools]
command = "npx"
args = ["-y", "chrome-devtools-mcp@latest"]
```

If you already have Playwright MCP configured, keep both entries. Example:

```toml
[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@latest"]

[mcp_servers.chrome_devtools]
command = "npx"
args = ["-y", "chrome-devtools-mcp@latest"]
```

Then restart the Codex app/session so MCP servers reload.

## 2. Local prerequisites

1. Install repo dependencies:
```bash
./scripts/bootstrap
```
2. Ensure Chrome/Chromium is available locally.
3. Optional explicit browser path:
```bash
export UI_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## 3. Run UI journeys locally

```bash
./scripts/ci ui
```

Default behavior:
- auto-starts frontend dev server if `UI_BASE_URL` is not reachable
- runs in deterministic mock-API mode (`UI_MOCK_API=1`)
- writes artifacts under `artifacts/ui/`

Common overrides:

```bash
# Run against an existing app instance
UI_AUTOSTART=0 UI_BASE_URL=http://127.0.0.1:3000 ./scripts/ci ui

# Run only specific journeys
UI_JOURNEYS=auth-flow,feed-view ./scripts/ci ui

# Run against live APIs (less deterministic)
UI_MOCK_API=0 ./scripts/ci ui
```

## 4. How Codex should use DevTools MCP in this repo

1. Reproduce the issue manually via DevTools MCP navigation.
2. Capture DOM/screenshot/console/network evidence.
3. Implement fix.
4. Validate with `./scripts/ci ui` for deterministic journey evidence.
5. Include artifact paths in PR notes.

## 5. Artifact contract

Per journey:
- `artifacts/ui/<journey>/<timestamp>/screenshot.png`
- `artifacts/ui/<journey>/<timestamp>/dom-snapshot.json`
- `artifacts/ui/<journey>/<timestamp>/console.json`
- `artifacts/ui/<journey>/<timestamp>/network.json`
- `artifacts/ui/<journey>/<timestamp>/performance-metrics.json`
- `artifacts/ui/<journey>/<timestamp>/trace.zip`
- `artifacts/ui/<journey>/<timestamp>/result.json`

Per run:
- `artifacts/ui/report-<timestamp>.md`
- `artifacts/ui/report-<timestamp>.json`
