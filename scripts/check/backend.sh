#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

npm --prefix "$ROOT_DIR/backend/backend" run lint:check
npm --prefix "$ROOT_DIR/backend/backend" run typecheck
CI=true npm --prefix "$ROOT_DIR/backend/backend" run test:ci
npm --prefix "$ROOT_DIR/backend/backend" run build
