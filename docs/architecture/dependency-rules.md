# Dependency Rules

Phase 2 will enforce these mechanically with structural tests/lints.

Backend direction
1. Controllers/Gateway -> Services
2. Services -> Schemas/Infra adapters
3. Schemas must not depend on services/controllers
4. DTOs should stay transport/domain boundary types (no infra side effects)

Frontend direction
1. `app` -> `components`/`hooks`/`lib`/`types`
2. `components` -> `hooks`/`lib`/`types`
3. `hooks` -> `actions`/`lib`/`types`
4. `lib`/`types` should not import `app`

Lint and structural checks are scaffolded in Phase 1 via:
- `./scripts/check/architecture.sh`
- `./scripts/check/invariants.sh`
