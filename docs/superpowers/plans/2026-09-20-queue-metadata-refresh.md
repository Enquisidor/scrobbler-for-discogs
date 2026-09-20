# Queue metadata refresh + unified source settings Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One metadata provider dropdown with artist/album toggles, plus a per-queue-item refresh button showing that provider’s icon.

**Architecture:** Keep `artistSource`/`albumSource` as the stored shape; settings UI maps dropdown+toggles onto them. `useMetadataFetcher` gains `refreshRelease(id)` for per-album force refetch without clearing cache on failure. QueueItem (web+mobile) shows the button when a non-Discogs source is active.

**Tech Stack:** React, Redux, existing Icons / SettingsSheet / useMetadataFetcher

## Global Constraints

- Do not clear metadata cache on failed refresh
- Refresh only the clicked release
- Hide button when both sources are Discogs / on history items
- Web and mobile stay in sync

---

### Task 1: Settings migration + UI (web + mobile)

**Files:**
- Modify: `libs/src/hooks/useSettings.ts` (optional normalize on load)
- Modify: `web/src/components/settings/SettingsSheet.tsx`
- Modify: `mobile/src/components/settings/SettingsSheet.tsx`
- Modify: `libs/src/hooks/__tests__/useSettings.test.ts` as needed

- [ ] Replace dual SourceSelects with one provider dropdown + two toggles
- [ ] Map toggles ↔ artistSource/albumSource
- [ ] Migrate mismatched dual providers to a single provider
- [ ] Update settings tests

### Task 2: `refreshRelease` on metadata fetcher

**Files:**
- Modify: `libs/src/hooks/useMetadata/useMetadataFetcher.ts`
- Modify: `libs/src/hooks/useMetadata/__tests__/useMetadataFetcher.test.ts`

- [ ] Return `{ refreshRelease }` from the hook
- [ ] Force re-queue one release; write metadata only on success
- [ ] Tests for refresh bypassing session cache

### Task 3: Queue item refresh button (web + mobile)

**Files:**
- Modify: `web/src/components/queue/QueueItem.tsx`
- Modify: `mobile/src/components/queue/QueueItem.tsx`
- Modify: `web/src/components/queue/QueueSheet.tsx` / mobile equivalent + MainScreen wiring
- Modify: queue item tests if present

- [ ] Add button with provider icon on collapsed header
- [ ] Wire `onRefreshMetadata` from MainScreen via QueueSheet
- [ ] Visibility rules as in spec
