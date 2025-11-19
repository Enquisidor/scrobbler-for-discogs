import type { EnrichedTrack } from '../../types';

export interface TrackGroup {
    heading: string;
    tracks: { track: EnrichedTrack; originalIndex: number }[];
}

export const assignGroups = (tracklist: EnrichedTrack[] | null): TrackGroup[] => {
    if (!tracklist) return [];

    const getPrefix = (track: EnrichedTrack): string => {
        if (track.position) {
            const match = track.position.match(/^([A-Z]+|^\d+-)/);
            if (match) return match[1].replace('-', '');
        }
        if (track.sub_tracks?.length) {
            for (const sub of track.sub_tracks) {
                const subPrefix = getPrefix(sub);
                if (subPrefix) return subPrefix;
            }
        }
        return '';
    };

    const rawGroups: { heading: string; tracksWithIndices: { track: EnrichedTrack; originalIndex: number }[] }[] = [];
    let currentRawGroup: { heading: string; tracksWithIndices: { track: EnrichedTrack; originalIndex: number }[] } | null = null;
    
    tracklist.forEach((track, index) => {
        if (track.type_ === 'heading') {
            if (currentRawGroup && currentRawGroup.tracksWithIndices.length > 0) {
                rawGroups.push(currentRawGroup);
            }
            currentRawGroup = { heading: track.title, tracksWithIndices: [] };
        } else {
            if (!currentRawGroup) {
                currentRawGroup = { heading: '', tracksWithIndices: [] };
            }
            currentRawGroup.tracksWithIndices.push({ track, originalIndex: index });
        }
    });
    if (currentRawGroup && currentRawGroup.tracksWithIndices.length > 0) {
        rawGroups.push(currentRawGroup);
    }

    return rawGroups.flatMap(rawGroup => {
        if (rawGroup.heading) {
            return [{ heading: rawGroup.heading, tracks: rawGroup.tracksWithIndices }];
        }

        const positionGroups = new Map<string, { track: EnrichedTrack; originalIndex: number }[]>();
        rawGroup.tracksWithIndices.forEach(({ track, originalIndex }) => {
            const prefix = getPrefix(track);
            if (!positionGroups.has(prefix)) {
                positionGroups.set(prefix, []);
            }
            positionGroups.get(prefix)!.push({ track, originalIndex });
        });
        
        if (positionGroups.size > 1) {
            return Array.from(positionGroups.entries()).map(([heading, tracks]) => ({
                heading: heading || 'Tracks',
                tracks
            }));
        }
        
        return [{ heading: '', tracks: rawGroup.tracksWithIndices }];
    });
};
