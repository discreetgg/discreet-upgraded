# Agent PR Protocol

1. Sync repo and run `./scripts/bootstrap`.
2. Implement smallest harness-safe change.
3. Run `./scripts/ci check`.
4. Include validation evidence in PR notes.
5. Keep product refactors out of harness-only phases.

UI legibility loop (Phase 3)
- Trigger non-blocking UI workflow by adding PR label `ui-check`.
- Download `artifacts/ui/**` from workflow run and summarize key findings in the PR.

Standard tools
- Use repository scripts directly.
- Use `gh` for PR operations when available.
