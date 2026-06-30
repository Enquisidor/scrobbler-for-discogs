
import type { DiscogsRelease, CombinedMetadata, Settings } from '../types';
import { MetadataSourceType } from '../types';
import { getSmartArtistDisplay, alignArtistsWithSource } from './formattingUtils';
import { getSourceMetadata } from './metadataUtils';

export function applyMetadataCorrections(
  rawCollection: DiscogsRelease[],
  allMetadata: Record<number, CombinedMetadata>,
  settings: Settings
): DiscogsRelease[] {
  return rawCollection.map(release => {
    const meta = allMetadata[release.id];
    if (!meta) return release;

    const newBasicInfo = { ...release.basic_information };
    let hasChanged = false;

    // --- Artist Correction Logic ---
    if (settings.artistSource !== MetadataSourceType.Discogs) {
        const sourceMeta = getSourceMetadata(meta, settings.artistSource);
        const sourceString = sourceMeta?.artist;
        
        if (sourceString) {
            const originalArtists = newBasicInfo.artists;
            const updatedArtists = alignArtistsWithSource(originalArtists, sourceString);
            const reconstructedDisplayName = getSmartArtistDisplay(originalArtists, meta, settings);

            // If the name changed, or the artist objects changed (deep check approximated), update.
            if (reconstructedDisplayName !== newBasicInfo.artist_display_name) {
                newBasicInfo.artist_display_name = reconstructedDisplayName;
                newBasicInfo.artists = updatedArtists;
                hasChanged = true;
            } else if (JSON.stringify(newBasicInfo.artists) !== JSON.stringify(updatedArtists)) {
                 // Even if display string is same, individual artist fields might have updated (e.g. clearing ANV)
                 newBasicInfo.artists = updatedArtists;
                 hasChanged = true;
            }
        }
    }

    // --- Album Correction Logic ---
    if (settings.albumSource !== MetadataSourceType.Discogs) {
        const sourceMeta = getSourceMetadata(meta, settings.albumSource);
        if (sourceMeta && sourceMeta.album && newBasicInfo.title !== sourceMeta.album) {
            newBasicInfo.title = sourceMeta.album;
            hasChanged = true;
        }
    }

    if (hasChanged) {
      return {
        ...release,
        basic_information: newBasicInfo,
      };
    }
    
    return release;
  });
}
