# Phase 4 Exact Plan (Proposed)

## Objective
Implement a real ephemeral observability loop (logs/metrics/traces), query it from scripts, and evaluate reliability budgets in CI (nightly/manual first, PR-gate later).

## Scope
- Keep Phase 4 harness-only: no broad product refactors.
- Reuse existing command contract:
  - `./scripts/obs/up.sh`
  - `./scripts/obs/query-logql.sh`
  - `./scripts/obs/query-promql.sh`
  - `./scripts/obs/query-traceql.sh`
  - `./scripts/obs/check-budgets.sh`
  - `./scripts/obs/down.sh`

## Implementation Slices

1. Ephemeral stack (local + CI)
- Replace `docker-compose.observability.yml` scaffold with:
  - Loki
  - Prometheus
  - Tempo
  - OpenTelemetry Collector
- Add config under `tools/obs/` for collector/prometheus/loki/tempo.
- `scripts/obs/up.sh` starts stack and waits for readiness probes.
- `scripts/obs/down.sh` tears down and prunes volumes for deterministic runs.

2. Signal emission
- Backend emits:
  - structured logs (JSON)
  - traces (OTLP)
  - latency/error metrics
- Frontend/UI loop contributes journey success/failure counters via artifacts summary ingestion.
- Keep instrumentation minimal and additive.

3. Query scripts become real
- `query-logql.sh`: fetch error counts and error-free journey denominator/numerator windows.
- `query-promql.sh`: fetch startup time and endpoint latency percentiles.
- `query-traceql.sh`: fetch root span durations for critical endpoints.
- All scripts output machine-readable JSON under `artifacts/obs/<timestamp>/`.

4. Budget evaluator
- `check-budgets.sh` reads `docs/reliability/budgets.yaml` and query outputs.
- Emit remediation-rich failures per budget key.
- Start non-blocking in nightly/manual workflows only.

5. CI rollout
- Add `.github/workflows/observability-legibility.yml`:
  - nightly schedule
  - manual dispatch
- Upload `artifacts/obs/**`.
- After 2 weeks stable signal, propose PR gating.

## Recommended Budget Enforcement Order

First enforce (lowest false-positive risk)
1. `error_free_journey_rate`
- Why first: directly reflects user-visible reliability of Phase 3 journeys.
- Initial enforce threshold: `>= 0.95` nightly window.

2. `startup_time_ms`
- Why second: deterministic to measure and easy to remediate.
- Initial enforce threshold: `<= 6000ms` app-ready metric.

Enforce after first two are stable
3. `api_p95_latency_ms`
- Initial enforce threshold: `<= 800ms` on key API endpoints.

4. `trace_span_budget_ms`
- Initial enforce threshold: `<= 1500ms` on critical root spans.

Tightening plan
- After 2 stable weeks, tighten toward current targets in `docs/reliability/budgets.yaml`:
  - startup `3000ms`
  - api p95 `400ms`
  - error-free `0.99`
  - trace span `750ms`

## Exit Criteria
- `./scripts/ci obs` produces deterministic artifacts and explicit pass/fail budget results.
- Nightly/manual workflow is stable with low flake rate.
- Promotion PR proposes exact thresholds for required checks.
