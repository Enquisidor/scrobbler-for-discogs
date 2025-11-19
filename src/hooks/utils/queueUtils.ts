import type { DiscogsTrack, EnrichedTrack, QueueItem, SelectedTracks, SelectedFeatures, Settings, LastfmTrackScrobble } from '../../types';

const cleanArtistName = (name: string): string => {
  return name.replace(/\s\(\d+\)$/, '').trim();
};

const formatArtists = (artists: any[]): string => {
    return artists.map(a => `${cleanArtistName(a.name)}${a.join || ''}`).join('').trim().replace(/,\s*$/, '');
};

export function enrichTracklist(tracklist: DiscogsTrack[] | undefined, albumArtistName: string): EnrichedTrack[] {
    if (!tracklist) return [];
    
    return tracklist.map(track => {
        const display_artist = (albumArtistName.toLowerCase() === 'various' && track.artists)
            ? formatArtists(track.artists)
            : albumArtistName;
        
        const featured_artists_string = track.extraartists
            ?.filter(a => a.role.toLowerCase().includes('feat'))
            .map(a => `${a.join || ''} ${cleanArtistName(a.name)}`)
            .join('')
            .trim() ?? '';
            
        const enrichedSubtracks = track.sub_tracks ? enrichTracklist(track.sub_tracks, display_artist) : undefined;

        return {
            ...track,
            display_artist,
            featured_artists: featured_artists_string ? `feat. ${featured_artists_string.replace(/^,\s*/, '').trim()}` : '',
            sub_tracks: enrichedSubtracks,
        };
    });
}

const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 180; // Default 3 minutes
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
    }
    return 180;
};


export function calculateScrobbleTimestamps(
    queue: QueueItem[], 
    selectedTracks: SelectedTracks, 
    currentTime: number,
    timeOffset: number
): Record<number, Record<string, number>> {
    const timestamps: Record<number, Record<string, number>> = {};

    const selectedTracksForTimestamping = queue.flatMap(release => {
        const selectedKeys = selectedTracks[release.id];
        if (!selectedKeys || selectedKeys.size === 0 || !release.tracklist) return [];
        
        const sortedKeys = Array.from(selectedKeys).sort((a, b) => {
            const aParts = a.split('-').map(Number);
            const bParts = b.split('-').map(Number);
            if (aParts[0] !== bParts[0]) return aParts[0] - bParts[0];
            return (aParts[1] ?? -1) - (bParts[1] ?? -1);
        });

        return sortedKeys.map(key => {
            const ids = key.split('-').map(Number);
            const parentTrack = release.tracklist![ids[0]];
            const track = ids.length > 1 ? parentTrack.sub_tracks![ids[1]] : parentTrack;
            return {
                releaseId: release.id,
                trackKey: key,
                durationInSeconds: parseDuration(track.duration),
            };
        });
    });

    if (selectedTracksForTimestamping.length === 0) return {};

    const startTime = currentTime + timeOffset;
    let currentTimestamp = startTime;

    selectedTracksForTimestamping.forEach(({ releaseId, trackKey, durationInSeconds }) => {
        if (!timestamps[releaseId]) timestamps[releaseId] = {};
        timestamps[releaseId][trackKey] = currentTimestamp;
        currentTimestamp += durationInSeconds;
    });

    return timestamps;
}

export function prepareTracksForScrobbling(
    queue: QueueItem[],
    selectedTracks: SelectedTracks,
    selectedFeatures: SelectedFeatures,
    settings: Settings,
    timeOffset: number,
): LastfmTrackScrobble[] {
    const now = Math.floor(Date.now() / 1000);
    
    const selectedTracksWithInfo = queue.flatMap(release => {
        const selectedKeys = selectedTracks[release.id];
        if (!selectedKeys || !release.tracklist) return [];
        
        const sortedKeys = Array.from(selectedKeys).sort((a, b) => {
            const aParts = a.split('-').map(Number);
            const bParts = b.split('-').map(Number);
            if (aParts[0] !== bParts[0]) return aParts[0] - bParts[0];
            return (aParts[1] ?? -1) - (bParts[1] ?? -1);
        });

        return sortedKeys.map(key => {
            const ids = key.split('-').map(Number);
            const parentTrack = release.tracklist![ids[0]];
            const track: EnrichedTrack = ids.length > 1 ? parentTrack.sub_tracks![ids[1]] : parentTrack;
            
            let artist = track.display_artist;
            if (settings.showFeatures && selectedFeatures[release.id]?.has(key) && track.featured_artists) {
                artist = `${artist} ${track.featured_artists}`;
            }
            
            return {
                artist: artist,
                title: track.title,
                durationInSeconds: parseDuration(track.duration),
            };
        });
    });

    if (selectedTracksWithInfo.length === 0) {
        return [];
    }
    
    const startTime = now + timeOffset;
    let currentTimestamp = startTime;

    return selectedTracksWithInfo.map(trackInfo => {
        const timestamp = currentTimestamp;
        currentTimestamp += trackInfo.durationInSeconds;
        return {
            artist: trackInfo.artist,
            track: trackInfo.title,
            timestamp: timestamp,
        };
    });
}