# Audit Fix Progress

## Fix 1 - Media Entitlement + Raw URL Exposure

### What was changed
- Added strict auth/entitlement checks for media proxy access in `/api/media/:id`:
  - Route now requires `JwtAuthGuard`.
  - Access is granted only to:
    - media owner
    - chat sender/receiver when permitted
    - receiver only after paid unlock for payable media
    - receiver free preview for in-message media by caption rule (`free preview` / `cover image`)
- Removed host-header (`origin`/`referer`) based media authorization logic as primary protection.
- Added safer streaming response headers (`Cache-Control: private`, `X-Content-Type-Options: nosniff`).
- Sanitized chat payloads so media `url` is no longer exposed in:
  - conversation history response
  - conversation list `lastMessage`
  - conversation-between response
  - websocket `message:new` / `message:ack` media payload
- Updated chat media UI to rely on proxied media IDs instead of direct media URLs in paid media components.

### Files touched
- `backend/backend/src/media/media.module.ts`
- `backend/backend/src/media/media.service.ts`
- `backend/backend/src/media/media.controller.ts`
- `backend/backend/src/chat/chat.service.ts`
- `backend/backend/src/chat/chat.gateway.ts`
- `frontend/frontend/components/message-media.tsx`
- `frontend/frontend/components/message-media-paid.tsx`

### Validation
- Backend build: pass
- Frontend build: pass
- Backend tests: `31/31` pass
- Frontend tests: `10/10` pass


## Fix 2 - Call Billing Integrity + Call-State Safety

### What was changed
- Reworked call payment reservation/finalization flow to prevent stuck reserved funds and mismatched settlement:
  - Added `batchDebitTx` to payment schema to track all per-minute reserve transactions for a call.
  - Updated `reserveCallPayment` to append reserve tx IDs and increment reserved amount atomically on existing call payments.
  - Rewrote `payForCall` to settle call payments transactionally:
    - commits all pending reserve txs for the call
    - handles refund of unused reserved amount to caller
    - handles additional debit if billed amount exceeds reserved amount
    - credits callee once for the final billed amount
    - marks payment as completed with normalized billed duration metadata
- Made call ending safer/idempotent in `ChatService`:
  - `endCall` now validates participant identity when called from authenticated REST path.
  - Caller/callee used for settlement are derived from the actual call record (not trusted from client DTO fields).
  - Added idempotent behavior for already-settled calls.
  - Non-ended outcomes now persist `callEndedAt`, `durationInSeconds`, and `missed` status.
- Tightened call status transition permissions:
  - Added `markCallOngoingForParticipant` and wired REST `PATCH /chat/call` to require requester participation.
- Fixed automatic timeout behavior in websocket gateway:
  - waitroom timeout now ends calls with `CallStatus.MISSED` (not `ENDED`).
  - automatic call-end cleanup now runs in `finally` so locks/timers are always released.
- Removed conflicting live per-minute debit loop from `call:start-billing` path to avoid double-charge scenarios versus `call:session` reservation flow.
- Frontend call signaling alignment fixes:
  - `call:answer` now includes `callId`, allowing waitroom state/timers to track the right call.
  - `call:session` emission is now caller-only to prevent unauthorized/mismatched reserve attempts from callee clients.

### Files touched
- `backend/backend/src/database/schemas/payment.schema.ts`
- `backend/backend/src/payment/payment.service.ts`
- `backend/backend/src/chat/chat.service.ts`
- `backend/backend/src/chat/chat.controller.ts`
- `backend/backend/src/chat/chat.gateway.ts`
- `frontend/frontend/hooks/use-call.ts`
- `frontend/frontend/context/call-context.tsx`

### Validation
- Backend build: pass
- Frontend build: pass
- Backend tests: `31/31` pass
- Frontend tests: `10/10` pass

## Fix 3 - Wallet Top-up Idempotency Consistency

### What was changed
- Fixed webhook/payment idempotency consistency in wallet top-up flow:
  - `topUp` now treats idempotency as gateway-reference based only (when a reference is provided).
  - duplicate detection now checks only provided external reference keys.
  - created top-up transactions now persist `reference`, so uniqueness/indexed dedupe is actually enforced.
- Preserved previous behavior for non-gateway/local top-ups by generating a UUID reference and storing it.

### Files touched
- `backend/backend/src/wallet/wallet.service.ts`

### Validation
- Backend build: pass
- Backend tests: `31/31` pass
- Frontend tests: `10/10` pass

## Fix 4 - Privileged Endpoint Hardening

### What was changed
- Restricted direct wallet funding endpoint abuse risk:
  - `POST /wallet/fund` now requires either:
    - admin role, or
    - explicit `ALLOW_LOCAL_WALLET_FUND=true` environment flag.
  - Prevents authenticated non-admin users from minting balance in production-like environments.
- Restricted direct email send endpoint:
  - `POST /notification/send-mail` is now admin-only (`JwtAuthGuard + RolesGuard + Roles(Role.ADMIN)`).
  - Prevents arbitrary authenticated user email dispatch abuse.

### Files touched
- `backend/backend/src/wallet/wallet.controller.ts`
- `backend/backend/src/notification/notification.controller.ts`

### Validation
- Backend build: pass
- Backend tests: `31/31` pass
- Frontend tests: `10/10` pass
