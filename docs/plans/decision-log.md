# Decision Log

## 2026-02-14
- Standardized deterministic toolchain to Node from `.nvmrc` and npm lockfile installs.
- Kept backend install deterministic with `npm ci --legacy-peer-deps` until dependency alignment is done.
- Declared `./scripts/ci check` as the single local/CI check source of truth.
- Replaced Phase 1 architecture/invariant scaffolds with executable checks and remediation-first failures.
- Added baseline-guarded invariants to prevent regression without forcing broad product refactors.
- Implemented Phase 3 UI legibility runner with CDP artifacts and journey-specific key API checks.
- Kept UI workflow non-blocking via PR label (`ui-check`), nightly schedule, and manual dispatch.
- Defaulted UI journey execution to deterministic mock API mode (`UI_MOCK_API=1`) to reduce flakiness.
- Added an exact Phase 4 observability implementation proposal with budget rollout order and threshold tightening strategy.
- Deferred full observability stack/query enforcement to Phase 4.
