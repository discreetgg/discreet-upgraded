#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend/frontend"
ARTIFACTS_DIR="${UI_ARTIFACTS_ROOT:-$ROOT_DIR/artifacts/ui}"
BASE_URL="${UI_BASE_URL:-http://127.0.0.1:3000}"
AUTO_START="${UI_AUTOSTART:-1}"
BASE_PORT="$(node -e "const u=new URL(process.argv[1]);console.log(u.port || (u.protocol === 'https:' ? '443' : '80'));" "$BASE_URL")"
START_CMD="${UI_START_COMMAND:-npm --prefix \"$FRONTEND_DIR\" run dev -- --hostname 127.0.0.1 --port $BASE_PORT}"
SERVER_LOG="$ARTIFACTS_DIR/frontend-dev-server.log"
STARTED_SERVER=0
SERVER_PID=""

wait_for_base_url() {
  local retries="$1"
  local sleep_seconds="$2"

  for ((i = 1; i <= retries; i += 1)); do
    if curl --silent --show-error --fail --max-time 3 "$BASE_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_seconds"
  done

  return 1
}

cleanup() {
  if [[ "$STARTED_SERVER" == "1" && -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

mkdir -p "$ARTIFACTS_DIR"

if ! wait_for_base_url 2 1; then
  if [[ "$AUTO_START" != "1" ]]; then
    echo "UI harness failed: $BASE_URL is not reachable and UI_AUTOSTART is disabled." >&2
    echo "Remediation: start the frontend server first (for example npm --prefix frontend/frontend run dev)." >&2
    exit 1
  fi

  echo "[ui] Base URL not reachable, starting frontend server..."
  bash -lc "$START_CMD" >"$SERVER_LOG" 2>&1 &
  SERVER_PID="$!"
  STARTED_SERVER=1

  if ! wait_for_base_url 60 2; then
    echo "UI harness failed: frontend did not become ready at $BASE_URL." >&2
    echo "Remediation: inspect $SERVER_LOG and verify local dev startup and environment." >&2
    tail -n 60 "$SERVER_LOG" >&2 || true
    exit 1
  fi
fi

echo "[ui] Running journeys against $BASE_URL"
UI_BASE_URL="$BASE_URL" \
UI_ARTIFACTS_ROOT="${UI_ARTIFACTS_ROOT:-artifacts/ui}" \
npm --prefix "$FRONTEND_DIR" run ui:journeys
