#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

node "$ROOT_DIR/tools/lint/no-console-runtime.mjs"
node "$ROOT_DIR/tools/lint/max-file-lines.mjs"
node "$ROOT_DIR/tools/lint/controller-boundary-dto.mjs"
