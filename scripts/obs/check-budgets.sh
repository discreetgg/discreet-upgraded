#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUDGET_FILE="$ROOT_DIR/docs/reliability/budgets.yaml"

if [[ ! -f "$BUDGET_FILE" ]]; then
  echo "Missing budgets file: $BUDGET_FILE" >&2
  exit 1
fi

echo "[phase1] Reliability budgets are documented at $BUDGET_FILE. Runtime budget checks land in Phase 4."
