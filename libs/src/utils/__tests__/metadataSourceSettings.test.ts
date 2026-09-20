import type { Settings } from '../../types';
import {
  getActiveMetadataProvider,
  getMetadataProviderForUi,
  migrateUnifiedMetadataSource,
  withCorrectAlbum,
  withCorrectArtist,
  withMetadataProvider,
} from '../metadataSourceSettings';

const base: Settings = {
  selectAllTracksPerRelease: true,
  selectSubtracksByDefault: true,
  showFeatures: true,
  selectFeaturesByDefault: false,
  showCredits: true,
  hideAlbumNames: false,
  darkMode: true,
  artistSource: 'discogs',
  albumSource: 'discogs',
};

describe('metadataSourceSettings', () => {
  it('migrates mismatched dual providers to artist source', () => {
    const migrated = migrateUnifiedMetadataSource({
      ...base,
      artistSource: 'apple',
      albumSource: 'musicbrainz',
    });
    expect(migrated.artistSource).toBe('apple');
    expect(migrated.albumSource).toBe('apple');
  });

  it('defaults UI provider to apple when both corrections are off', () => {
    expect(getMetadataProviderForUi(base)).toBe('apple');
    expect(getActiveMetadataProvider(base)).toBeNull();
  });

  it('maps provider + toggles onto artistSource/albumSource', () => {
    let next = withCorrectArtist(base, true, 'deezer');
    expect(next.artistSource).toBe('deezer');
    expect(next.albumSource).toBe('discogs');

    next = withCorrectAlbum(next, true, 'deezer');
    expect(next.albumSource).toBe('deezer');

    next = withMetadataProvider(next, 'apple');
    expect(next.artistSource).toBe('apple');
    expect(next.albumSource).toBe('apple');

    next = withCorrectArtist(next, false);
    expect(next.artistSource).toBe('discogs');
    expect(next.albumSource).toBe('apple');
  });
});
