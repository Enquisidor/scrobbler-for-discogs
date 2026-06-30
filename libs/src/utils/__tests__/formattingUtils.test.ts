import { MetadataSourceType } from '../../types';
import type { DiscogsArtist, CombinedMetadata, Settings } from '../../types';
import {
    validateArtistName,
    getSmartArtistDisplay,
    formatArtistsForMetadataSearch,
    generateMetadataSearchArtistQueries,
} from '../formattingUtils';

const appleSettings: Settings = {
    artistSource: MetadataSourceType.Apple,
    albumSource: MetadataSourceType.Discogs,
} as Settings;

describe('validateArtistName', () => {
    it('keeps standard Mike without ANV even when source says MIKE', () => {
        const artist: DiscogsArtist = { id: 1, name: 'Mike' };
        expect(validateArtistName(artist, 'MIKE')).toBe('Mike');
    });

    it('keeps ANV mike even when source says MIKE', () => {
        const artist: DiscogsArtist = { id: 1, name: 'Mike', anv: 'mike' };
        expect(validateArtistName(artist, 'MIKE')).toBe('mike');
    });

    it('uses ANV MIKE when that is the Discogs ANV', () => {
        const artist: DiscogsArtist = { id: 1, name: 'Mike', anv: 'MIKE' };
        expect(validateArtistName(artist, 'MIKE')).toBe('MIKE');
    });

    it('keeps stylized ANV mike. even when source says MIKE', () => {
        const artist: DiscogsArtist = { id: 1, name: 'Mike', anv: 'mike.' };
        expect(validateArtistName(artist, 'MIKE')).toBe('mike.');
    });
});

describe('formatArtistsForMetadataSearch', () => {
    it('merges split names and uses ANVs for metadata search', () => {
        const artists: DiscogsArtist[] = [
            { id: 1, name: 'Earl', join: ',' },
            { id: 2, name: 'Sweatshirt', join: ',' },
            { id: 3, name: 'Mike', anv: 'MIKE', join: ',' },
            { id: 4, name: 'Surf Gang' },
        ];
        expect(formatArtistsForMetadataSearch(artists)).toBe('Earl Sweatshirt, MIKE & Surf Gang');
    });

    it('uses & joiner for E L U C I D collab search', () => {
        const artists: DiscogsArtist[] = [
            { id: 1, name: 'E L U C I D', join: ',' },
            { id: 2, name: 'Sebb Bash' },
        ];
        expect(formatArtistsForMetadataSearch(artists)).toBe('E L U C I D & Sebb Bash');
    });
});

describe('generateMetadataSearchArtistQueries', () => {
    it('includes both heuristically formatted and raw discogs strings', () => {
        const artists: DiscogsArtist[] = [
            { id: 1, name: 'Earl', join: ',' },
            { id: 2, name: 'Sweatshirt', join: ',' },
            { id: 3, name: 'Mike', anv: 'MIKE', join: ',' },
            { id: 4, name: 'Surf Gang' },
        ];
        expect(generateMetadataSearchArtistQueries(artists)).toEqual([
            'Earl Sweatshirt, MIKE & Surf Gang',
            'Earl, Sweatshirt, MIKE, Surf Gang',
        ]);
    });
});

describe('getSmartArtistDisplay', () => {
    const meta = (artist: string): CombinedMetadata => ({ apple: { artist } });

    it('uses & joiner from source over Discogs commas', () => {
        const artists: DiscogsArtist[] = [
            { id: 1, name: 'E L U C I D', join: ',' },
            { id: 2, name: 'Sebb Bash' },
        ];
        expect(getSmartArtistDisplay(artists, meta('E L U C I D & Sebb Bash'), appleSettings))
            .toBe('E L U C I D & Sebb Bash');
    });

    it('merges split Discogs artists to match source', () => {
        const artists: DiscogsArtist[] = [
            { id: 1, name: 'Earl', join: ',' },
            { id: 2, name: 'Sweatshirt', join: ',' },
            { id: 3, name: 'MIKE', join: ',' },
            { id: 4, name: 'Surf Gang' },
        ];
        expect(getSmartArtistDisplay(artists, meta('Earl Sweatshirt, MIKE & Surf Gang'), appleSettings))
            .toBe('Earl Sweatshirt, MIKE & Surf Gang');
    });

    it('does not adopt source MIKE when Discogs has Mike without ANV', () => {
        const artists: DiscogsArtist[] = [
            { id: 1, name: 'Earl', join: ',' },
            { id: 2, name: 'Sweatshirt', join: ',' },
            { id: 3, name: 'Mike', join: ',' },
            { id: 4, name: 'Surf Gang' },
        ];
        expect(getSmartArtistDisplay(artists, meta('Earl Sweatshirt, MIKE & Surf Gang'), appleSettings))
            .toBe('Earl Sweatshirt, Mike & Surf Gang');
    });
});
