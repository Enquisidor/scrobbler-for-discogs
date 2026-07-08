
import type { DiscogsRelease, CombinedMetadata, Settings } from '../types';
import { MetadataSourceType } from '../types';
import { getSmartArtistDisplay, alignArtistsWithSource } from './formattingUtils';
import { getMetadataArtistString, getSourceMetadata } from './metadataUtils';

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

    // --- Artist Correction Logic (joiners + merges from any external metadata source) ---
    const sourceString = getMetadataArtistString(meta, settings);

    if (sourceString) {
        const originalArtists = newBasicInfo.artists;
        const updatedArtists = alignArtistsWithSource(originalArtists, sourceString);
        const reconstructedDisplayName = getSmartArtistDisplay(originalArtists, meta, settings);

        if (reconstructedDisplayName !== newBasicInfo.artist_display_name) {
            newBasicInfo.artist_display_name = reconstructedDisplayName;
            newBasicInfo.artists = updatedArtists;
            hasChanged = true;
        } else if (JSON.stringify(newBasicInfo.artists) !== JSON.stringify(updatedArtists)) {
             newBasicInfo.artists = updatedArtists;
             hasChanged = true;
        }
    }

    // --- Album Correction Logic ---
    if (settings.albumSource !== MetadataSourceType.Discogs) {
        const sourceMeta = getSourceMetadata(meta, settings.albumSource);
        if (sourceMeta?.album && newBasicInfo.title !== sourceMeta.album) {
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
