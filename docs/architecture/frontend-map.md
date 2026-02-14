# Frontend Architecture Map

Root: `frontend/frontend`

Primary layers
- Routes/UI composition: `app/**`
- Reusable UI blocks: `components/**`
- State/context: `context/**`
- Client hooks/actions: `hooks/**`, `actions/**`
- Platform/data utilities: `lib/**`
- Shared types: `types/**`

Current high-risk areas to enforce later
- Very large files under `components/`, `hooks/`, and `lib/services.ts`.
- Mixed responsibility in route modules and feature components.

Phase 1 note
- This map is descriptive only; structural enforcement starts in Phase 2.
