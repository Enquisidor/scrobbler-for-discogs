# Per-queue metadata refresh + unified source settings

**Date:** 2026-09-20  
**Status:** Approved

## Summary

External metadata is only fetched for albums in the scrobble queue. Users can force-refetch a single queued album via a header button that shows the active provider icon. Metadata settings use one provider dropdown plus separate enable toggles for artist and album.

## Settings

### UI
- One dropdown: Apple Music / MusicBrainz / Deezer
- Toggle: Correct artist names
- Toggle: Correct album titles
- Both toggles off → no external fetch (Discogs display)

### Data model (unchanged shape)
Keep `artistSource` / `albumSource`:
- Enabled field → selected provider
- Disabled field → `discogs`

When the dropdown changes, rewrite any enabled field to the new provider.

When both fields are `discogs`, the dropdown defaults to Apple Music in the UI (preference not persisted until a toggle is on).

### Migration
If persisted settings have two different non-Discogs providers, coerce both enabled fields to the artist provider (or the sole non-Discogs provider if only one is set).

## Queue refresh button

- Shown on collapsed queue row (not history) when either source is non-Discogs
- Icon = active provider logo (single source after settings change)
- Click → force-refetch that release only via `useMetadataFetcher.refreshRelease(releaseId)`
- On failure: do not clear or overwrite existing cached metadata for that release
- Platforms: web + mobile

## Out of scope
- Clearing cache on failed refresh
- Global force-refresh of entire queue from this button
- Persisting dropdown preference when both toggles are off
