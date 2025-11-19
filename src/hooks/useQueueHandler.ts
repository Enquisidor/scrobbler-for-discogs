import { useState, useMemo, useCallback, useEffect } from 'react';
import { fetchReleaseTracklist } from '../services/discogsService';
import { scrobbleTracks as scrobbleLastfmTracks } from '../services/lastfmService';
import type { Credentials, DiscogsRelease, QueueItem, Settings } from '../types';
import { useTrackSelection } from './useTrackSelection';
import { enrichTracklist, calculateScrobbleTimestamps, prepareTracksForScrobbling } from './utils/queueUtils';

export function useQueueHandler(credentials: Credentials, settings: Settings, onQueueSuccess: (message: string) => void) {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isScrobbling, setIsScrobbling] = useState(false);
    const [scrobbleError, setScrobbleError] = useState<string | null>(null);
    const [scrobbleTimeOffset, setScrobbleTimeOffset] = useState(0); // in seconds

    const {
        selectedTracks,
        selectedFeatures,
        totalSelectedTracks,
        initializeSelection,
        clearSelection,
        resetSelections,
        ...selectionHandlers
    } = useTrackSelection(queue, settings);

    const toggleAlbumInQueue = useCallback(async (release: DiscogsRelease) => {
        const isInQueue = queue.some(item => item.id === release.id);

        if (isInQueue) {
            setQueue(prevQueue => prevQueue.filter(item => item.id !== release.id));
            clearSelection(release.id);
        } else {
            const newItem: QueueItem = { ...release, tracklist: null, isLoading: true };
            setQueue(prevQueue => [...prevQueue, newItem]);

            try {
                const fullRelease = await fetchReleaseTracklist(release.id, credentials.discogsAccessToken, credentials.discogsAccessTokenSecret);
                const enrichedTracklist = enrichTracklist(fullRelease.tracklist, release.basic_information.artist_display_name);
                
                const finalItem = { ...newItem, ...release, tracklist: enrichedTracklist, isLoading: false };
                setQueue(prevQueue => prevQueue.map(item => item.id === release.id ? finalItem : item));
                
                initializeSelection(finalItem);

            } catch (err) {
                console.error("Failed to fetch tracklist:", err);
                setQueue(prevQueue => prevQueue.filter(item => item.id !== release.id));
            }
        }
    }, [queue, credentials.discogsAccessToken, credentials.discogsAccessTokenSecret, initializeSelection, clearSelection]);
    
    const handleScrobble = async () => {
        setIsScrobbling(true);
        setScrobbleError(null);
        
        const tracksToScrobble = prepareTracksForScrobbling(queue, selectedTracks, selectedFeatures, settings, scrobbleTimeOffset);

        if (tracksToScrobble.length === 0) {
            setScrobbleError("No tracks selected to scrobble.");
            setIsScrobbling(false);
            return;
        }

        try {
            await scrobbleLastfmTracks(tracksToScrobble, credentials.lastfmSessionKey, credentials.lastfmApiKey, credentials.lastfmSecret);
            onQueueSuccess(`Successfully scrobbled ${tracksToScrobble.length} tracks!`);
            setQueue([]);
            resetSelections();
        } catch (err) {
            setScrobbleError(err instanceof Error ? err.message : "Failed to scrobble tracks.");
        } finally {
            setIsScrobbling(false);
        }
    };
    
    const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000));
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Math.floor(Date.now() / 1000));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const scrobbleTimestamps = useMemo(() => {
        return calculateScrobbleTimestamps(queue, selectedTracks, currentTime, scrobbleTimeOffset);
    }, [queue, selectedTracks, currentTime, scrobbleTimeOffset]);

    return {
        queue,
        selectedTracks,
        selectedFeatures,
        isScrobbling,
        scrobbleError,
        totalSelectedTracks,
        scrobbleTimestamps,
        scrobbleTimeOffset,
        setScrobbleTimeOffset,
        toggleAlbumInQueue,
        handleScrobble,
        ...selectionHandlers,
    };
}