# Follow-Up Plan: Remove `npm ci --legacy-peer-deps`

## Problem
Backend currently requires `npm ci --legacy-peer-deps` due Nest package peer mismatch.

## Goal
Run deterministic backend install with plain `npm ci`.

## Steps
1. Inventory Nest package versions in `backend/backend/package.json` and lockfile.
2. Choose a single compatible major strategy:
   - all Nest 10-compatible peers, or
   - coordinated migration to Nest 11-compatible peers.
3. Update dependency versions in one branch and regenerate lockfile.
4. Verify install with plain `npm ci` in a clean environment.
5. Remove `--legacy-peer-deps` from `scripts/bootstrap`.
6. Add CI assertion step that fails if legacy peer flag is reintroduced.

## Validation
- `npm ci --prefix backend/backend` passes without legacy flags.
- `./scripts/ci check` remains green.

## Rollback Strategy
- If dependency graph causes runtime regression, revert lockfile + version set and re-open migration with narrower increments.
