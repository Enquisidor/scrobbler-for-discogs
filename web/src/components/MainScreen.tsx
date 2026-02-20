
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { Credentials, Settings } from '@libs';
import {
  RootState,
  clearMetadata,
  SortOption,
  useDiscogsCollection,
  useCollectionFilters,
  useMetadataFetcher,
  useQueue,
  applyMetadataCorrections
} from '@libs';
import CollectionScreen from './collection/CollectionScreen';
import SettingsSheet from './settings/SettingsSheet';
import QueueButton from './queue/QueueButton';
import QueueSheet from './queue/QueueSheet';
import Header from './layout/Header';
import CollectionFilters from './collection/CollectionFilters';
import { useAuthHandler } from '../hooks/useAuth/useAuthHandler';

interface MainScreenProps {
  credentials: Credentials;
  onCredentialsChange: (credentials: Partial<Credentials>) => void;
  onDiscogsLogout: () => void;
  onLastfmLogout: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  updateLastActivity: () => Promise<void>;
}

type Notification = { message: string; type: 'success' | 'error' };

const CLIENT_PAGE_SIZE = 50;

export default function MainScreen({
  credentials,
  onCredentialsChange,
  onDiscogsLogout,
  onLastfmLogout,
  settings,
  onSettingsChange,
  updateLastActivity,
}: MainScreenProps) {
  const dispatch = useDispatch();
  const isDiscogsConnected = !!credentials.discogsAccessToken;

  const [sortOption, setSortOption] = useState<SortOption>(SortOption.AddedNewest);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [queueView, setQueueView] = useState<'queue' | 'history'>('queue');
  const [notification, setNotification] = useState<Notification | null>(null);

  const {
    loadingService,
    error: authError,
    handleDiscogsConnect,
    handleLastfmConnect,
  } = useAuthHandler(credentials, onCredentialsChange);

  const {
    collection: fullCollection,
    isLoading: isCollectionLoading,
    isSyncing,
    error: collectionError,
    isAuthError: isDiscogsAuthError,
    forceReload: forceDiscogsReload,
  } = useDiscogsCollection(credentials, isDiscogsConnected, {
    onForceReload: () => sessionStorage.setItem('force-metadata-fetch', 'true'),
  });

  useEffect(() => {
    if (isDiscogsAuthError) {
      onDiscogsLogout();
      setNotification({ message: 'Discogs connection failed. Please reconnect.', type: 'error' });
    }
  }, [isDiscogsAuthError, onDiscogsLogout]);

  const metadata = useSelector((state: RootState) => state.metadata.data);

  const handleQueueSuccess = useCallback((message: string) => {
    if (!message.startsWith('Scrobbled')) {
      setIsQueueOpen(false);
    }
    setNotification({ message, type: 'success' });
    const timeoutId = setTimeout(() => setNotification(null), 5000);
    // Update last activity on successful scrobbles to prevent credential expiry
    updateLastActivity();
    return () => clearTimeout(timeoutId);
  }, [updateLastActivity]);

  const queueHandler = useQueue(credentials, settings, handleQueueSuccess);

  const collectionWithCorrections = useMemo(() => {
    return applyMetadataCorrections(fullCollection, metadata, settings);
  }, [fullCollection, metadata, settings]);

  useMetadataFetcher(fullCollection, settings, {
    checkForceFetch: () => sessionStorage.getItem('force-metadata-fetch') === 'true',
    clearForceFetch: () => sessionStorage.removeItem('force-metadata-fetch'),
  });

  const {
    searchTerm, setSearchTerm,
    albumsPerRow, setAlbumsPerRow,
    selectedFormat, setSelectedFormat,
    selectedYear, setSelectedYear,
    filterOptions,
    filteredAndSortedCollection,
    handleResetFilters,
    isFiltered,
  } = useCollectionFilters(collectionWithCorrections, sortOption, setSortOption);

  const [displayedCount, setDisplayedCount] = useState(CLIENT_PAGE_SIZE);

  useEffect(() => {
    setDisplayedCount(CLIENT_PAGE_SIZE);
    window.scrollTo(0, 0);
  }, [searchTerm, sortOption, selectedFormat, selectedYear]);

  // When filtered results grow (e.g. new collection pages arrive during search),
  // ensure displayedCount covers all results if they fit within one page
  useEffect(() => {
    if (filteredAndSortedCollection.length <= CLIENT_PAGE_SIZE) {
      setDisplayedCount(CLIENT_PAGE_SIZE);
    }
  }, [filteredAndSortedCollection.length]);

  const displayedCollection = useMemo(() => {
    return filteredAndSortedCollection.slice(0, displayedCount);
  }, [filteredAndSortedCollection, displayedCount]);

  const hasMore = displayedCount < filteredAndSortedCollection.length;

  const loadMore = useCallback(() => {
    setDisplayedCount(prev => Math.min(prev + CLIENT_PAGE_SIZE, filteredAndSortedCollection.length));
  }, [filteredAndSortedCollection.length]);

  const error = authError || collectionError;

  const handleForceReload = () => {
    if (isSyncing || isCollectionLoading) return;
    dispatch(clearMetadata());
    forceDiscogsReload();
  };

  const handleOpenQueue = () => {
    setQueueView('queue');
    setIsQueueOpen(true);
  }

  const handleOpenHistory = () => {
    setQueueView('history');
    setIsQueueOpen(true);
  }

  const portalRoot = document.getElementById('portal-root');

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <Header
          isSyncing={isSyncing}
          credentials={credentials}
          loadingService={loadingService}
          handleDiscogsConnect={handleDiscogsConnect}
          onDiscogsLogout={onDiscogsLogout}
          isCollectionLoading={isCollectionLoading}
          handleForceReload={handleForceReload}
          handleLastfmConnect={handleLastfmConnect}
          onLastfmLogout={onLastfmLogout}
          setIsSettingsOpen={setIsSettingsOpen}
        />

        {notification && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full py-2 px-6 text-sm font-semibold shadow-lg ${notification.type === 'error'
            ? 'bg-red-500/20 border border-red-500/30 text-red-300'
            : 'bg-green-500/20 border border-green-500/30 text-green-300'
            }`}>
            {notification.message}
          </div>
        )}
        {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-300 mb-6">{error}</div>}

        {isDiscogsConnected && (
          <CollectionFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            albumsPerRow={albumsPerRow}
            setAlbumsPerRow={setAlbumsPerRow}
            selectedFormat={selectedFormat}
            setSelectedFormat={setSelectedFormat}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            filterOptions={filterOptions}
            isFiltered={isFiltered}
            handleResetFilters={handleResetFilters}
            totalScrobbledAlbums={queueHandler.totalScrobbledAlbums}
            totalScrobbledTracks={queueHandler.totalScrobbledTracks}
            handleOpenHistory={handleOpenHistory}
            totalFilteredCount={filteredAndSortedCollection.length}
            displayedCount={displayedCollection.length}
          />
        )}

        <CollectionScreen
          collection={displayedCollection}
          queue={queueHandler.queue}
          isLoading={isCollectionLoading}
          isSyncing={isSyncing}
          hasMore={hasMore}
          onLoadMore={loadMore}
          isFiltered={isFiltered}
          albumsPerRow={albumsPerRow}
          onAddAlbumToQueue={queueHandler.addAlbumToQueue}
          onRemoveLastInstanceOfAlbumFromQueue={queueHandler.removeLastInstanceOfAlbumFromQueue}
          onRemoveAllInstancesOfAlbumFromQueue={queueHandler.removeAllInstancesOfAlbumFromQueue}
          onConnectDiscogs={handleDiscogsConnect}
          isConnectingDiscogs={loadingService === 'discogs'}
          settings={settings}
          metadata={metadata}
        />
      </div>

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <QueueButton
        queueCount={queueHandler.queue.length}
        selectedTrackCount={queueHandler.totalSelectedTracks}
        onClick={handleOpenQueue}
      />

      {portalRoot && !!credentials.discogsAccessToken && ReactDOM.createPortal(
        <QueueSheet
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
          view={queueView}
          queue={queueHandler.queue}
          selectedTracks={queueHandler.selectedTracks}
          selectedFeatures={queueHandler.selectedFeatures}
          artistSelections={queueHandler.artistSelections}
          scrobbleTimestamps={queueHandler.scrobbleTimestamps}
          scrobbleTimeOffset={queueHandler.scrobbleTimeOffset}
          onScrobbleTimeOffsetChange={queueHandler.setScrobbleTimeOffset}
          settings={settings}
          metadata={metadata}
          onTrackToggle={queueHandler.handleTrackToggle}
          onFeatureToggle={queueHandler.handleFeatureToggle}
          onArtistToggle={queueHandler.handleArtistToggle}
          onToggleParent={queueHandler.handleToggleParent}
          onSelectParentAsSingle={queueHandler.handleSelectParentAsSingle}
          onSelectAll={queueHandler.handleSelectAll}
          onDeselectAll={queueHandler.handleDeselectAll}
          onToggleGroup={queueHandler.handleToggleGroup}
          onScrobble={queueHandler.handleScrobble}
          isScrobbling={queueHandler.isScrobbling}
          scrobbleError={queueHandler.scrobbleError}
          totalSelectedTracks={queueHandler.totalSelectedTracks}
          onRemoveAlbumInstanceFromQueue={queueHandler.removeAlbumInstanceFromQueue}
          onScrobbleModeToggle={queueHandler.handleScrobbleModeToggle}
          isLastfmConnected={!!credentials.lastfmSessionKey}
          scrobbledHistory={queueHandler.scrobbledHistory}
          onScrobbleSingleRelease={queueHandler.handleScrobbleSingleRelease}
        />,
        portalRoot
      )}
    </>
  );
}