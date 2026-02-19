# AGENTS.md

This file is the agent operating contract for this repository.
It is intentionally short and points to `docs/` as the system of record.

## Primary Goal
- Keep the repo agent-operable end-to-end: deterministic checks, explicit docs, and repeatable PR workflows.

## Source Of Truth
- Docs index: [`docs/index.md`](docs/index.md)
- Architecture map: [`docs/architecture/backend-map.md`](docs/architecture/backend-map.md), [`docs/architecture/frontend-map.md`](docs/architecture/frontend-map.md)
- Dependency rules: [`docs/architecture/dependency-rules.md`](docs/architecture/dependency-rules.md)
- Planning artifacts: [`docs/plans/README.md`](docs/plans/README.md)
- Agent workflow protocol: [`docs/workflows/agent-pr-protocol.md`](docs/workflows/agent-pr-protocol.md)
- Agent review loop protocol: [`docs/workflows/agent-review-protocol.md`](docs/workflows/agent-review-protocol.md)
- UI legibility plan: [`docs/legibility/ui-journeys.md`](docs/legibility/ui-journeys.md)
- Observability legibility plan: [`docs/legibility/observability.md`](docs/legibility/observability.md)
- Reliability budgets: [`docs/reliability/budgets.yaml`](docs/reliability/budgets.yaml)
- DevTools MCP setup plan: [`docs/tooling/devtools-mcp.md`](docs/tooling/devtools-mcp.md)
- Doc gardening automation prompt: [`docs/automation/doc-gardening.prompt.md`](docs/automation/doc-gardening.prompt.md)

## Determinism Contract
- Node version is pinned in [`.nvmrc`](.nvmrc).
- Package manager strategy is `npm` only.
- Install dependencies with `npm ci`.
- Lockfiles in scope for determinism:
  - `backend/backend/package-lock.json`
  - `frontend/frontend/package-lock.json`
- Do not introduce additional lockfiles (`pnpm-lock.yaml`, `bun.lock`, `yarn.lock`) without an explicit repo-wide migration.

## Command Contract
- Bootstrap: `./scripts/bootstrap`
- Single check gate: `./scripts/ci check`
- UI legibility command (Phase 1 stub): `./scripts/ci ui`
- Observability legibility command (Phase 1 stub): `./scripts/ci obs`
- Full harness: `./scripts/ci full`

## CI Contract
- CI must run the same command used locally: `./scripts/ci check`.
- CI checks must be non-mutating.
- `lint:check` is allowed in CI, `lint:fix` is not.

## Planning Contract
- Small tasks use [`docs/plans/templates/small-task.md`](docs/plans/templates/small-task.md).
- Larger tasks use [`docs/plans/templates/execution-plan.md`](docs/plans/templates/execution-plan.md).
- Active plans go under `docs/plans/active/`.
- Cross-task decisions go to [`docs/plans/decision-log.md`](docs/plans/decision-log.md).

## PR Execution Rules
- Agents should operate through PR-ready changes with explicit evidence.
- Use repository commands directly; avoid ad-hoc command drift.
- Follow the protocol in [`docs/workflows/agent-pr-protocol.md`](docs/workflows/agent-pr-protocol.md).
- Run agent self-review and targeted review loops per [`docs/workflows/agent-review-protocol.md`](docs/workflows/agent-review-protocol.md).

## Phase Boundaries
- Phase 1 includes docs and script scaffolding for UI/observability.
- Phase 3 implements DevTools MCP journey execution.
- Phase 4 implements ephemeral observability stack + query checks.

## Change Scope Guardrails
- Keep harness changes separate from product refactors.
- If a task needs product refactoring, record it in planning artifacts and handle separately.

## Documentation Hygiene
- Keep docs cross-linked and current.
- `./scripts/check/docs.sh` enforces required structure and link integrity.

## If Unsure
- Default to the docs index and do the smallest deterministic change that keeps `./scripts/ci check` green.
