# Phase 3/4 Gated Deliverables Plan

## Gate Before Phase 3
- `./scripts/ci check` remains green with Phase 2 enforcement.
- Architecture and invariant checks are stable in CI for at least 3 consecutive days.

## Phase 3: UI Legibility (Non-Blocking)

Current status
- Initial implementation complete and green locally via `./scripts/ci ui`.
- CI workflow added at `.github/workflows/ui-legibility.yml`.

Deliverables
1. Implement DevTools-driven journeys using CDP/MCP-compatible automation.
2. Execute critical journeys:
   - feed view
   - auth callback
   - cams connect
3. Persist artifacts per run:
   - screenshots
   - DOM snapshots
   - console summary
   - network summary

CI rollout (non-blocking)
1. Add workflow triggered by PR label (`ui-check`) and nightly schedule.
2. Upload artifacts for each run.
3. Publish concise pass/fail summary in workflow output.

Promotion gate to stable Phase 3
- At least 1 week of nightly runs with no harness flakes above agreed threshold.

## Gate Before Phase 4
- Phase 3 artifacts are consistently generated and actionable.
- Journey instability rate is below agreed threshold.

## Phase 4: Observability Legibility (Nightly/On-Demand)

Deliverables
1. Implement ephemeral local observability stack for logs/metrics/traces.
2. Wire query scripts:
   - LogQL
   - PromQL
   - TraceQL
3. Enforce measurable budgets from `docs/reliability/budgets.yaml`.

CI rollout (initially non-blocking)
1. Nightly schedule and manual dispatch.
2. Upload query outputs and budget evaluation artifacts.
3. Keep out of PR required checks until signal is stable.

Promotion gate for PR enforcement consideration
- 2 weeks stable nightly execution and low false-positive budget failures.
