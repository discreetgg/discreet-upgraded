# Codex Loop Driver

Use `scripts/codex-loop` to run Codex in headless iterations with a max-loop cap.

## Why
- Keeps a single task running across multiple non-interactive passes.
- Stores per-iteration prompts/logs/final messages under `artifacts/codex-loop/`.
- Uses `codex exec` with `--approval-policy never` by default.

## Basic Usage
```bash
./scripts/codex-loop "Fix media 429s and prove with ./scripts/ci check"
```

This runs up to 10 iterations by default.

## Useful Flags
- `--max-iterations 10`
- `--model gpt-5-codex`
- `--config model_reasoning_effort="high"` (repeatable)
- `--approval-policy never`
- `--sandbox workspace-write`
- `--prompt-file docs/plans/active/my-task.md`
- `--search`

## Example (your requested style)
```bash
./scripts/codex-loop \
  "Stabilize media loading under high concurrency and include evidence" \
  --model gpt-5-codex \
  --max-iterations 10 \
  --approval-policy never
```

## Artifacts
Each run writes:
- `metadata.txt`
- `task.txt`
- `iter-XX-prompt.md`
- `iter-XX.log`
- `iter-XX-last-message.txt`

Path format:
`artifacts/codex-loop/<run-label>-<UTC timestamp>/`

## Loop Status Contract
The script asks Codex to end each iteration with one line:
- `LOOP_STATUS: DONE`
- `LOOP_STATUS: CONTINUE`
- `LOOP_STATUS: BLOCKED`

Exit codes:
- `0` => done
- `2` => blocked
- `3` => max iterations reached without `DONE`
