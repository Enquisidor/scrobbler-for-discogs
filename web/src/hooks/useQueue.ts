

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReleaseTracklist } from '../services/discogsService';
import { scrobbleTracks as scrobbleLastfmTracks } from '../services/lastfmService';
import type { Credentials, DiscogsRelease, QueueItem, Settings } from '../libs';
import type { RootState } from '../store/index';
import { useTrackSelection } from './useTrackSelection';
import { calculateScrobbleTimestamps, prepareTracksForScrobbling } from '../libs';
import {
    addToQueue,
    updateQueueItem,
    removeLastInstanceOf,
    removeAllInstancesOf,
    removeFromQueue,
    updateScrobbleMode,
    setScrobbling,
    setScrobbleError,
    scrobbleSingleSuccess,
    scrobbleSuccess,
    setTimeOffset
} from '../store/queueSlice';

export function useQueue(
    credentials: Credentials,
    settings: Settings,
    onQueueSuccess: (message: string) => void
) {
    const dispatch = useDispatch();
    const { queue, scrobbledHistory, isScrobbling, scrobbleError, scrobbleTimeOffset } = useSelector((state: RootState) => state.queue);
    const metadata = useSelector((state: RootState) => state.metadata.data);

    const {
        selectedTracks,
        selectedFeatures,
        artistSelections,
        totalSelectedTracks,
        initializeSelection,
        clearSelectionForInstance,
        resetSelections,
        handleScrobbleModeToggle: handleTrackSelectionScrobbleModeToggle,
        ...selectionHandlers
    } = useTrackSelection(queue, settings);

    const addAlbumToQueue = useCallback(async (release: DiscogsRelease) => {
        const instanceKey = `${release.id}-${Date.now()}-${Math.random()}`;
        const newItem: QueueItem = { ...release, instanceKey, tracklist: null, isLoading: true, useTrackArtist: true };
        dispatch(addToQueue(newItem));

        try {
            const fullRelease = await fetchReleaseTracklist(release.id, credentials.discogsAccessToken, credentials.discogsAccessTokenSecret);
            const queueItemWithTracks: QueueItem = {
                ...newItem,
                ...release,
                identifiers: fullRelease.identifiers,
                tracklist: fullRelease.tracklist,
                isLoading: false
            };
            dispatch(updateQueueItem(queueItemWithTracks));
            initializeSelection(queueItemWithTracks);
        } catch (err) {
            const errorItem = { ...newItem, isLoading: false, error: err instanceof Error ? err.message : 'Failed to load tracks' };
            dispatch(updateQueueItem(errorItem));
        }
    }, [credentials.discogsAccessToken, credentials.discogsAccessTokenSecret, initializeSelection, dispatch]);

    const removeLastInstanceOfAlbumFromQueue = useCallback((releaseId: number) => {
        let lastInstance: QueueItem | undefined;
        for (let i = queue.length - 1; i >= 0; i--) {
            if (queue[i].id === releaseId) {
                lastInstance = queue[i];
                break;
            }
        }
        if (lastInstance) {
            clearSelectionForInstance(lastInstance.instanceKey);
            dispatch(removeLastInstanceOf({ releaseId }));
        }
    }, [queue, clearSelectionForInstance, dispatch]);

    const removeAllInstancesOfAlbumFromQueue = useCallback((releaseId: number) => {
        queue.filter(item => item.id === releaseId).forEach(instance => clearSelectionForInstance(instance.instanceKey));
        dispatch(removeAllInstancesOf({ releaseId }));
    }, [queue, clearSelectionForInstance, dispatch]);

    const removeAlbumInstanceFromQueue = useCallback((instanceKey: string) => {
        clearSelectionForInstance(instanceKey);
        dispatch(removeFromQueue({ instanceKey }));
    }, [clearSelectionForInstance, dispatch]);

    const handleScrobbleModeToggle = useCallback((instanceKey: string, useTrackArtist: boolean) => {
        dispatch(updateScrobbleMode({ instanceKey, useTrackArtist }));
        handleTrackSelectionScrobbleModeToggle(instanceKey, useTrackArtist);
    }, [handleTrackSelectionScrobbleModeToggle, dispatch]);

    const handleScrobbleSingleRelease = useCallback(async (instanceKey: string) => {
        dispatch(setScrobbling(true));

        const itemToScrobble = queue.find(item => item.instanceKey === instanceKey);
        if (!itemToScrobble) {
            dispatch(setScrobbleError("Could not find the release in the queue."));
            return;
        }

        // PASS SETTINGS HERE
        const tracksToScrobble = prepareTracksForScrobbling([itemToScrobble], selectedTracks, artistSelections, metadata, scrobbleTimeOffset, settings);

        if (tracksToScrobble.length === 0) {
            dispatch(setScrobbling(false));
            dispatch(setScrobbleError("No tracks selected for this release."));
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

            dispatch(scrobbleSingleSuccess({ scrobbledItem }));
            clearSelectionForInstance(instanceKey);
            onQueueSuccess(`Scrobbled ${tracksToScrobble.length} tracks from "${itemToScrobble.basic_information.title}"!`);

        } catch (err) {
            dispatch(setScrobbleError(err instanceof Error ? err.message : "Failed to scrobble tracks."));
        }
    }, [queue, selectedTracks, artistSelections, metadata, scrobbleTimeOffset, credentials, clearSelectionForInstance, onQueueSuccess, dispatch, settings]);

    const handleScrobble = useCallback(async () => {
        dispatch(setScrobbling(true));

        // PASS SETTINGS HERE
        const tracksToScrobble = prepareTracksForScrobbling(queue, selectedTracks, artistSelections, metadata, scrobbleTimeOffset, settings);

        if (tracksToScrobble.length === 0) {
            dispatch(setScrobbling(false));
            dispatch(setScrobbleError("No tracks selected to scrobble."));
            return;
        }

        try {
            await scrobbleLastfmTracks(tracksToScrobble, credentials.lastfmSessionKey, credentials.lastfmApiKey, credentials.lastfmSecret);

            const itemsToMoveToHistory = queue.map(item => ({
                ...item,
                scrobbledTrackCount: (selectedTracks[item.instanceKey] || new Set()).size,
                scrobbledTrackKeys: Array.from(selectedTracks[item.instanceKey] || []),
            }));

            dispatch(scrobbleSuccess({ itemsToMove: itemsToMoveToHistory }));
            resetSelections();
            onQueueSuccess(`Successfully scrobbled ${tracksToScrobble.length} tracks!`);
        } catch (err) {
            dispatch(setScrobbleError(err instanceof Error ? err.message : "Failed to scrobble tracks."));
        }
    }, [queue, selectedTracks, artistSelections, metadata, scrobbleTimeOffset, credentials, resetSelections, onQueueSuccess, dispatch, settings]);

    const setScrobbleTimeOffset = useCallback((offset: number) => {
        dispatch(setTimeOffset(offset));
    }, [dispatch]);

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
        handleScrobbleModeToggle,
        handleScrobble,
        handleScrobbleSingleRelease,
        totalScrobbledAlbums,
        totalScrobbledTracks,
        ...selectionHandlers,
    };
}