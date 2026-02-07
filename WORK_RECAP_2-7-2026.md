# Discreet Work Recap - February 7, 2026

## Scope covered
- Chat/message loading and scroll behavior.
- Home feed network over-fetching and request flood.
- Creators carousel UI redesign and interaction behavior.
- Frontend/backend boundary analysis for remaining latency.

## Frontend work completed

### 1) Chat behavior and scroll stability
- Investigated chat/message loading flow with DevTools MCP.
- Reduced redundant chat/network activity caused by duplicated chat lifecycle usage in message preview paths.
- Improved upward infinite-scroll behavior for older messages with scroll-position preservation.
- Added anchor-aware restore logic so top-loading older messages is less likely to jump viewport.
- Removed unstable rendering optimization that was causing chat height/scrollbar instability.
- Cleaned high-frequency debug logs adding noise/overhead during message flow.
- Unified required props across message containers/pages for consistent behavior.

Primary chat files involved:
- `frontend/frontend/components/message-chat-list.tsx`
- `frontend/frontend/components/message-item.tsx`
- `frontend/frontend/components/dm-menu-preview.tsx`
- `frontend/frontend/components/message-container.tsx`
- `frontend/frontend/app/(dashboard)/(protected)/messages/page.tsx`
- `frontend/frontend/components/conversation-list.tsx`
- `frontend/frontend/hooks/use-chat.ts`

### 2) Home feed network optimization (major reduction)
- Removed forced CORS preflight amplification on cross-origin GET calls by disabling cache takeover headers.
- Kept auth cookie flow on read-only requests and avoided unnecessary Authorization header on GET/HEAD/OPTIONS.
- Deferred per-post `has-liked` and `has-bookmarked` status checks until card visibility/interactions.
- Removed eager per-card bookmark status query from post card mount path.
- Added safe Discord avatar URL validation fallback to avoid broken avatar request spam.

Files updated for this:
- `frontend/frontend/lib/axios.ts`
- `frontend/frontend/components/post-like-button.tsx`
- `frontend/frontend/components/shared/bookmark-button.tsx`
- `frontend/frontend/components/post.tsx`
- `frontend/frontend/components/feed-post.tsx`
- `frontend/frontend/lib/utils.ts`
- `frontend/frontend/components/user-avatar.tsx`
- `frontend/frontend/components/user-avatar-with-status.tsx`

### 3) Creators section UI/UX updates
- Reworked creator card to banner-first style (3:1 feel), with bottom readability treatment.
- Removed follow button from creator cards; retained name + handle presentation.
- Refined avatar treatment (flush circular border) and reduced text size for cleaner hierarchy.
- Darkened lower visual area for better contrast/readability.
- Removed autoplay from creators carousel (manual-only via swipe/dots/arrows).
- Made full creator card container clickable to open creator profile.

Files updated for this:
- `frontend/frontend/components/top-creators-card.tsx`
- `frontend/frontend/components/top-creators.tsx`

## DevTools MCP verification summary
- Home page request count reduced from roughly **148 -> 83** on reload.
- High-volume `OPTIONS` preflight spam from frontend GET patterns was removed.
- Initial per-post status calls now limited to visible content instead of all loaded cards.
- Broken Discord avatar request noise dropped due to frontend validation fallback.
- Creator card click-to-profile verified (`/` -> `/{username}` navigation succeeded).

## What is still backend-side (not frontend)

### A) DM/conversation latency
Observed slow path remains backend/network:
- `GET /api/chat/conversations/:id?limit=50` can still take multi-second durations (seen in 7s-12s range previously).

Backend actions:
- Add/verify indexes for conversation message fetch path (`conversationId`, `createdAt`).
- Return minimal sender/receiver projection needed for chat list/page.
- Avoid deep/heavy populate for each message row in hot paths.
- Move to cursor pagination windows (latest N, then backfill) with stable sort/index use.
- Add short-lived cache for recent conversation windows and invalidate on new message.

### B) Feed like/bookmark status endpoint shape
Frontend now defers status requests, but ideal backend shape is:
- Include `viewerHasLiked` and `viewerHasBookmarked` in `/post` response.

Alternative:
- Add a batched status endpoint for post IDs to replace N per-post calls.

### C) Media/image response speed
If individual media assets still feel slow despite `200`:
- Ensure CDN-backed caching policy (`Cache-Control`) and efficient origin path.
- Prefer direct object storage/CDN edge delivery over dynamic API passthrough when possible.

## Backend-to-frontend connection notes
- No backend change is required for the new creators UI behavior itself (design/interaction is frontend-complete).
- Backend changes are strongly recommended for:
  - Chat thread fetch latency.
  - Eliminating remaining per-item status chattiness via richer feed payloads.
  - Media delivery consistency under load.

## Current status
- Frontend UX/perf improvements are implemented and verified locally with DevTools MCP.
- Remaining major bottleneck is backend chat data path performance.

---

## Session Addendum - Sellers/Cams/Sorting/Chat Key Fixes (Feb 7, 2026)

## Scope covered
- Sellers grid card redesign and layout behavior updates.
- Sellers and cams filter/sort UX simplification.
- Removal of unsupported placeholder sort features.
- Chat duplicate key warning root-cause fix in media/message rendering.

## Sellers page work completed

### 1) Seller card redesign
- Replaced old image-stretch card with profile-focused card treatment and full-card click behavior.
- Added banner-first card structure (3:1 style) similar to side creator cards.
- Kept motion polish while reducing idle glow intensity to avoid visual overpowering.
- Tightened name/username spacing and adjusted vertical balance around avatar/banner overlap.

Primary files:
- `frontend/frontend/components/sellers/seller-card.tsx`

### 2) Sellers page layout and grid density
- Removed right-side creators module from sellers page only (kept elsewhere).
- Updated sellers grid from 2-column to 3-column on larger screens.
- Adjusted shared home layout behavior so sellers content can reclaim right-rail width when no side content is present, preserving perceived card size.

Primary files:
- `frontend/frontend/components/sellers/sellers-grid.tsx`
- `frontend/frontend/app/(dashboard)/(unprotected)/(home)/layout.tsx`

### 3) Sellers filter UX simplification
- Replaced multi-filter/race-tab style with a single sort dropdown button.
- Introduced seller-specific sort options and wired sorting in sellers page logic.
- Later removed unsupported timestamp-driven sort options to avoid placeholder behavior.

Final seller sort options now:
- `Rank`
- `Random`

Primary files:
- `frontend/frontend/components/sellers/sellers-filter-bar.tsx`
- `frontend/frontend/app/(dashboard)/(unprotected)/(home)/sellers/page.tsx`
- `frontend/frontend/lib/data.ts`

## Cams page work completed

### 1) Filter bar cleanup
- Removed ethnicity/race section from cams filter bar.
- Kept only cams-state filters:
  - `Taking cams`
  - `Not Taking cams`

Primary files:
- `frontend/frontend/components/cams/cams-filter-bar.tsx`
- `frontend/frontend/app/(dashboard)/(unprotected)/(home)/cams/page.tsx`

### 2) Sort options and random refresh
- Removed `Highest Price` and `Lowest Price`.
- Added random refresh flow for random sorting via URL seed trigger.
- Added stale sort-value guard in dropdown state handling.
- Added then removed `Recently Active` after confirming backend data incompleteness.

Final cams sort options now:
- `Random`
- `Popular`

Primary files:
- `frontend/frontend/components/sort-dropdown.tsx`
- `frontend/frontend/app/(dashboard)/(unprotected)/(home)/cams/page.tsx`
- `frontend/frontend/lib/data.ts`

## Unsupported feature cleanup decision (no placeholders)
- Removed timestamp-dependent sorting features that did not work reliably with current data shape.
- Confirmed backend user schema does not explicitly define timestamps and live creators payload had sparse timestamp population across sellers.
- Aligned frontend sort UX strictly to data-backed options.

Evidence checked:
- `backend/backend/src/database/schemas/user.schema.ts`
- `backend/backend/src/user/user.service.ts`
- Live endpoint sample: `GET /api/user/creators`

## Chat console warning fix (duplicate React keys)
- Investigated runtime warning:
  - `Encountered two children with the same key...`
- Root cause:
  - Media/message list renders relied on backend IDs that can collide in sibling arrays.
- Fix implemented:
  - Replaced fragile key usage with stable composite keys (`id + url + index` pattern).
  - Removed redundant nested `key` props on non-list children in mapped blocks.

Primary files:
- `frontend/frontend/components/message-media.tsx`
- `frontend/frontend/components/message-media-paid.tsx`
- `frontend/frontend/components/dm-menu-preview.tsx`
- `frontend/frontend/components/message-chat-list.tsx`

## Net result
- Sellers and cams UI now expose only features that work with current backend data.
- Random sort can be explicitly re-shuffled by users in both sellers and cams contexts.
- Duplicate-key chat warning path was hardened against repeated/duplicate media IDs.
