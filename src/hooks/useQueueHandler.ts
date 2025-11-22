

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { fetchReleaseTracklist } from '../services/discogsService';
import { scrobbleTracks as scrobbleLastfmTracks } from '../services/lastfmService';
import type { Credentials, DiscogsRelease, QueueItem, Settings, AppleMusicMetadata } from '../types';
import { useTrackSelection } from './useTrackSelection';
import { calculateScrobbleTimestamps, prepareTracksForScrobbling } from './utils/queueUtils';

export function useQueueHandler(
    credentials: Credentials, 
    settings: Settings, 
    onQueueSuccess: (message: string) => void,
    metadata: Record<number, AppleMusicMetadata>
) {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [scrobbledHistory, setScrobbledHistory] = useState<QueueItem[]>([]);
    const [isScrobbling, setIsScrobbling] = useState(false);
    const [scrobbleError, setScrobbleError] = useState<string | null>(null);
    const [scrobbleTimeOffset, setScrobbleTimeOffset] = useState(0); // in seconds

    const {
        selectedTracks,
        selectedFeatures,
        artistSelections,
        totalSelectedTracks,
        initializeSelection,
        clearSelectionForInstance,
        resetSelections,
        handleScrobbleModeToggle,
        ...selectionHandlers
    } = useTrackSelection(queue, settings);

    const prevQueueRef = useRef<QueueItem[]>([]);
    useEffect(() => {
        console.log('[QueueHandler] Queue state updated.', { 
            oldSize: prevQueueRef.current.length, 
            newSize: queue.length,
            queue: queue.map(i => i.basic_information.title)
        });
        if (queue.length === 0 && prevQueueRef.current.length > 0) {
            console.warn('[QueueHandler] Queue became empty unexpectedly.', {
                from: prevQueueRef.current.map(i => i.basic_information.title)
            });
        }
        prevQueueRef.current = queue;
    }, [queue]);

    const addAlbumToQueue = useCallback(async (release: DiscogsRelease) => {
        console.log(`[QueueHandler] ACTION: addAlbumToQueue for "${release.basic_information.title}" (ID: ${release.id})`);
        const instanceKey = `${release.id}-${Date.now()}-${Math.random()}`;
        const newItem: QueueItem = { ...release, instanceKey, tracklist: null, isLoading: true, useTrackArtist: true };
        setQueue(prevQueue => [...prevQueue, newItem]);

        try {
            console.log(`[QueueHandler] Fetching tracklist for ${release.id}...`);
            const fullRelease = await fetchReleaseTracklist(release.id, credentials.discogsAccessToken, credentials.discogsAccessTokenSecret);
            
            const queueItemWithTracks: QueueItem = { 
                ...newItem, 
                ...release, 
                identifiers: fullRelease.identifiers, 
                tracklist: fullRelease.tracklist, 
                isLoading: false 
            };

            console.log(`[QueueHandler] Fetched tracklist for ${release.id}. Updating item and initializing selection.`);
            setQueue(prevQueue => prevQueue.map(item => item.instanceKey === instanceKey ? queueItemWithTracks : item));
            initializeSelection(queueItemWithTracks);

        } catch (err) {
            console.error(`[QueueHandler] Failed to fetch tracklist for ${release.id}:`, err);
            setQueue(prevQueue => prevQueue.map(item => 
                item.instanceKey === instanceKey 
                ? { ...item, isLoading: false, error: err instanceof Error ? err.message : 'Failed to load tracks' } 
                : item
            ));
        }
    }, [credentials.discogsAccessToken, credentials.discogsAccessTokenSecret, initializeSelection]);

    const removeLastInstanceOfAlbumFromQueue = useCallback((releaseId: number) => {
        console.log(`[QueueHandler] ACTION: removeLastInstanceOfAlbumFromQueue for ID: ${releaseId}`);
        let lastInstanceKey: string | null = null;
        const newQueue = [...queue];
        for (let i = newQueue.length - 1; i >= 0; i--) {
            if (newQueue[i].id === releaseId) {
                lastInstanceKey = newQueue[i].instanceKey;
                newQueue.splice(i, 1);
                break;
            }
        }

        if (lastInstanceKey) {
            setQueue(newQueue);
            clearSelectionForInstance(lastInstanceKey);
        }
    }, [queue, clearSelectionForInstance]);

    const removeAllInstancesOfAlbumFromQueue = useCallback((releaseId: number) => {
        console.log(`[QueueHandler] ACTION: removeAllInstancesOfAlbumFromQueue for ID: ${releaseId}`);
        const instancesToRemove = queue.filter(item => item.id === releaseId);
        if (instancesToRemove.length === 0) return;

        setQueue(prevQueue => prevQueue.filter(item => item.id !== releaseId));
        instancesToRemove.forEach(instance => clearSelectionForInstance(instance.instanceKey));
    }, [queue, clearSelectionForInstance]);

    const removeAlbumInstanceFromQueue = useCallback((instanceKey: string) => {
        console.log(`[QueueHandler] ACTION: removeAlbumInstanceFromQueue for key: ${instanceKey}`);
        setQueue(prevQueue => prevQueue.filter(item => item.instanceKey !== instanceKey));
        clearSelectionForInstance(instanceKey);
    }, [clearSelectionForInstance]);

    const onScrobbleModeToggle = (instanceKey: string, useTrackArtist: boolean) => {
        setQueue(prevQueue => prevQueue.map(item => 
            item.instanceKey === instanceKey ? { ...item, useTrackArtist } : item
        ));
        handleScrobbleModeToggle(instanceKey, useTrackArtist);
    };
    
    const handleScrobbleSingleRelease = async (instanceKey: string) => {
        console.log(`[QueueHandler] ACTION: handleScrobbleSingleRelease for key: ${instanceKey}`);
        setIsScrobbling(true);
        setScrobbleError(null);

        const itemToScrobble = queue.find(item => item.instanceKey === instanceKey);
        if (!itemToScrobble) {
            setScrobbleError("Could not find the release in the queue.");
            setIsScrobbling(false);
            return;
        }
        
        const tracksToScrobble = prepareTracksForScrobbling(
            [itemToScrobble],
            selectedTracks,
            artistSelections,
            metadata,
            scrobbleTimeOffset
        );

        if (tracksToScrobble.length === 0) {
            setScrobbleError("No tracks selected for this release.");
            setIsScrobbling(false);
            return;
        }

        try {
            await scrobbleLastfmTracks(tracksToScrobble, credentials.lastfmSessionKey, credentials.lastfmApiKey, credentials.lastfmSecret);
            
            const scrobbledKeysForItem = Array.from(selectedTracks[itemToScrobble.instanceKey] || []);
            const scrobbledItem = { 
                ...itemToScrobble, 
                scrobbledTrackCount: tracksToScrobble.length,
                scrobbledTrackKeys: scrobbledKeysForItem,
            };

            console.log(`[QueueHandler] Single scrobble successful. Removing item ${instanceKey} from queue.`);
            setQueue(prev => prev.filter(item => item.instanceKey !== instanceKey));
            setScrobbledHistory(prev => [scrobbledItem, ...prev]);
            clearSelectionForInstance(instanceKey);
            
            onQueueSuccess(`Scrobbled ${tracksToScrobble.length} tracks from "${itemToScrobble.basic_information.title}"!`);

        } catch (err) {
            setScrobbleError(err instanceof Error ? err.message : "Failed to scrobble tracks.");
        } finally {
            setIsScrobbling(false);
        }
    };
    
    const handleScrobble = async () => {
        console.log('[QueueHandler] ACTION: handleScrobble (all)');
        setIsScrobbling(true);
        setScrobbleError(null);
        
        const tracksToScrobble = prepareTracksForScrobbling(queue, selectedTracks, artistSelections, metadata, scrobbleTimeOffset);

        if (tracksToScrobble.length === 0) {
            setScrobbleError("No tracks selected to scrobble.");
            setIsScrobbling(false);
            return;
        }

        try {
            await scrobbleLastfmTracks(tracksToScrobble, credentials.lastfmSessionKey, credentials.lastfmApiKey, credentials.lastfmSecret);
            onQueueSuccess(`Successfully scrobbled ${tracksToScrobble.length} tracks!`);
            
            const itemsToMoveToHistory = [...queue].map(item => {
                const scrobbledKeysForItem = Array.from(selectedTracks[item.instanceKey] || []);
                return {
                    ...item,
                    scrobbledTrackCount: scrobbledKeysForItem.length,
                    scrobbledTrackKeys: scrobbledKeysForItem,
                };
            }).reverse();
            
            console.log('[QueueHandler] Scrobble successful. Clearing queue.');
            setScrobbledHistory(prev => [...itemsToMoveToHistory, ...prev]);
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

    const totalScrobbledAlbums = scrobbledHistory.length;
    const totalScrobbledTracks = useMemo(() => {
        return scrobbledHistory.reduce((acc, item) => acc + (item.scrobbledTrackCount || 0), 0);
    }, [scrobbledHistory]);

    return {
        queue,
        scrobbledHistory,
        selectedTracks,
        selectedFeatures,
        artistSelections,
        isScrobbling,
        scrobbleError,
        totalSelectedTracks,
        scrobbleTimestamps,
        scrobbleTimeOffset,
        setScrobbleTimeOffset,
        addAlbumToQueue,
        removeLastInstanceOfAlbumFromQueue,
        removeAllInstancesOfAlbumFromQueue,
        removeAlbumInstanceFromQueue,
        handleScrobbleModeToggle: onScrobbleModeToggle,
        handleScrobble,
        handleScrobbleSingleRelease,
        totalScrobbledAlbums,
        totalScrobbledTracks,
        ...selectionHandlers,
    };
}