# Mobile App Test Coverage Gaps

## Currently Tested (6 files)
- ✅ `components/AlbumCard.tsx`
- ✅ `components/CollectionScreen.tsx`
- ✅ `hooks/useStorage.ts`
- ✅ `hooks/useSettings.ts`
- ✅ `hooks/useAuth/useCredentials.ts`
- ✅ `hooks/useAuth/useAuthHandler.ts`

---

## Missing Tests (Priority 1 = Highest, 5 = Lowest)

### Priority 1 - Critical (OAuth & Core State)

| File | Type | Why Critical |
|------|------|--------------|
| `adapters/cryptoAdapter.ts` | Adapter | OAuth signatures MUST be correct or auth fails completely |
| `services/discogsService.ts` | Service | OAuth 1.0a flow, API calls, retry logic, rate limit handling |
| `services/lastfmService.ts` | Service | Auth flow, MD5 signatures, scrobbling API |
| `store/queueSlice.ts` | Redux | Core queue state: add/remove/scrobble operations |
| `store/trackSelectionSlice.ts` | Redux | Complex nested selection logic (tracks, subtracks, features) |

### Priority 2 - High (Data Fetching & Display)

| File | Type | Why Important |
|------|------|---------------|
| `hooks/useCollection/useDiscogsCollection.ts` | Hook | Collection sync, pagination, concurrent workers, rate limiting |
| `store/collectionSlice.ts` | Redux | Collection state, sync progress, error states |
| `components/queue/QueueSheet.tsx` | Component | Complex modal with queue display, scrobble actions |
| `components/queue/QueueItem.tsx` | Component | Track list display, remove/scrobble per item |

### Priority 3 - Medium (Integration & Settings)

| File | Type | Why Important |
|------|------|---------------|
| `components/MainScreen.tsx` | Component | Integration of all hooks, state flow |
| `components/layout/Header.tsx` | Component | Connection status display, auth buttons |
| `components/settings/SettingsSheet.tsx` | Component | Settings toggles, metadata source selection |
| `store/metadataSlice.ts` | Redux | Metadata caching, TTL logic |

### Priority 4 - Low (Simple UI)

| File | Type | Notes |
|------|------|-------|
| `components/queue/QueueButton.tsx` | Component | Simple FAB with badges |
| `components/misc/Notification.tsx` | Component | Simple toast display |

### Priority 5 - Minimal (Thin Wrappers)

| File | Type | Notes |
|------|------|-------|
| `adapters/storageAdapter.ts` | Adapter | Thin wrapper around AsyncStorage/SecureStore |

---

## Test Creation Order

1. `cryptoAdapter.test.ts` - Verify HMAC-SHA1 and MD5 match expected outputs
2. `discogsService.test.ts` - Mock fetch, test OAuth signature, retry logic
3. `lastfmService.test.ts` - Mock fetch, test MD5 signature, scrobble payload
4. `queueSlice.test.ts` - Test all reducers: add, remove, scrobble actions
5. `trackSelectionSlice.test.ts` - Test selection logic with nested tracks
6. `useDiscogsCollection.test.ts` - Mock service, test pagination, error handling
7. `collectionSlice.test.ts` - Test loading states, sync progress
8. `QueueSheet.test.tsx` - Render tests, user interactions
9. `QueueItem.test.tsx` - Track display, action buttons

---

## Summary

| Priority | Count | Files |
|----------|-------|-------|
| 1 (Critical) | 5 | cryptoAdapter, discogsService, lastfmService, queueSlice, trackSelectionSlice |
| 2 (High) | 4 | useDiscogsCollection, collectionSlice, QueueSheet, QueueItem |
| 3 (Medium) | 4 | MainScreen, Header, SettingsSheet, metadataSlice |
| 4 (Low) | 2 | QueueButton, Notification |
| 5 (Minimal) | 1 | storageAdapter |
| **Total** | **16** | |
