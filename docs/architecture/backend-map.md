# Backend Architecture Map

Root: `backend/backend`

Primary layers
- Entry/boot: `src/main.ts`, `src/app.module.ts`
- Transport/API: `src/**/**.controller.ts`, `src/chat/chat.gateway.ts`
- Domain/application: `src/**/**.service.ts`
- Data access: `src/database/**`, schema models in `src/database/schemas`
- Infra adapters: `src/redis`, `src/file-uploader`, external integrations (`discord-bot`, webhooks)

Current high-risk coupling to reduce in later phases
- `chat` and `payment` modules use `forwardRef` circular dependency.
- Large multi-responsibility services (`chat.service.ts`, `post.service.ts`, `payment.service.ts`).

Phase 1 note
- This map is descriptive only; structural enforcement starts in Phase 2.
