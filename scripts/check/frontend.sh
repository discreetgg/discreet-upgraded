#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

npm --prefix "$ROOT_DIR/frontend/frontend" run lint:check
npm --prefix "$ROOT_DIR/frontend/frontend" run typecheck
CI=true npm --prefix "$ROOT_DIR/frontend/frontend" run test:ci
npm --prefix "$ROOT_DIR/frontend/frontend" run build
