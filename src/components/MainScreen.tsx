

import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Credentials, Settings } from '../types';
import { SortOption } from '../types';
import CollectionScreen from './collection/CollectionScreen';
import SettingsSheet from './settings/SettingsSheet';
import QueueButton from './queue/QueueButton';
import QueueSheet from './queue/QueueSheet';
import { useAuthHandler } from '../hooks/useAuthHandler';
import { useDiscogsCollection } from '../hooks/useDiscogsCollection';
import { useCollectionFilters } from '../hooks/useCollectionFilters';
import { useQueueHandler } from '../hooks/useQueueHandler';
import { useAppleMusicMetadata } from '../hooks/useAppleMusicMetadata';
import { useMetadataFetcher } from '../hooks/useMetadataFetcher';
import ConnectionButton from './misc/ConnectionButton';
import { Loader } from './misc/Loader';
import { SettingsIcon, RefreshIcon } from './misc/Icons';
import { applyAppleMusicCorrections } from '../hooks/utils/collectionUtils';

interface MainScreenProps {
  credentials: Credentials;
  onCredentialsChange: (credentials: Partial<Credentials>) => void;
  onDiscogsLogout: () => void;
  onLastfmLogout: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function MainScreen({ 
  credentials, 
  onCredentialsChange,
  onDiscogsLogout, 
  onLastfmLogout,  
  settings,
  onSettingsChange,
}: MainScreenProps) {
  const isDiscogsConnected = !!credentials.discogsAccessToken;
  
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.AddedNewest);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [queueView, setQueueView] = useState<'queue' | 'history'>('queue');
  const [notification, setNotification] = useState<string | null>(null);
  
  const { 
    loadingService, 
    error: authError, 
    handleDiscogsConnect,
    handleLastfmConnect,
// FIX: Corrected typo from `onCredentials-Change` to `onCredentialsChange`.
  } = useAuthHandler(credentials, onCredentialsChange);
  
  const { 
    collection: rawCollection, 
    isLoading: isCollectionLoading, 
    isSyncing, 
    hasMore,
    loadMore,
    error: collectionError,
    forceReload: forceDiscogsReload,
  } = useDiscogsCollection(credentials, isDiscogsConnected, sortOption);

  const { metadata: appleMusicMetadata, updateMetadata, clearMetadata } = useAppleMusicMetadata();
  
  const handleQueueSuccess = (message: string) => {
    if (!message.startsWith('Scrobbled')) {
        setIsQueueOpen(false);
    }
    setNotification(message);
    const timeoutId = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timeoutId);
  };
  
  const queueHandler = useQueueHandler(credentials, settings, handleQueueSuccess, appleMusicMetadata);

  const collection = useMemo(() => {
    return applyAppleMusicCorrections(rawCollection, appleMusicMetadata, settings);
  }, [rawCollection, appleMusicMetadata, settings]);
  
  useMetadataFetcher(rawCollection, appleMusicMetadata, updateMetadata, settings);
  
  const {
    searchTerm, setSearchTerm,
    albumsPerRow, setAlbumsPerRow,
    selectedFormat, setSelectedFormat,
    selectedYear, setSelectedYear,
    filterOptions,
    filteredAndSortedCollection,
    handleResetFilters,
    isFiltered,
  } = useCollectionFilters(collection, sortOption, setSortOption);

  const error = authError || collectionError;
  
  const handleForceReload = () => {
    if (isSyncing || isCollectionLoading) return;
    clearMetadata();
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
  
  console.log('[MainScreen] State before render:', {
    isDiscogsConnected,
    queueLength: queueHandler.queue.length,
    totalSelectedTracks: queueHandler.totalSelectedTracks,
    isCollectionLoading,
    isSyncing,
    error,
  });

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold">Scrobbler for Discogs</h1>
            {isSyncing && <div title="Syncing..." className="self-center"><Loader /></div>}
          </div>
          <div className="flex items-center gap-2">
            <ConnectionButton service="discogs" isConnected={isDiscogsConnected} username={credentials.discogsUsername} onConnect={handleDiscogsConnect} onDisconnect={onDiscogsLogout} isLoading={loadingService === 'discogs'} isDisabled={!!loadingService}/>
            {isDiscogsConnected && (
              <button 
                onClick={handleForceReload}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-wait"
                aria-label="Reload collection"
                title="Reload collection from Discogs"
                disabled={isSyncing || isCollectionLoading}
              >
                <RefreshIcon className="w-6 h-6" />
              </button>
            )}
            <ConnectionButton service="lastfm" isConnected={!!credentials.lastfmSessionKey} username={credentials.lastfmUsername} onConnect={handleLastfmConnect} onDisconnect={onLastfmLogout} isLoading={loadingService === 'lastfm'} isDisabled={!!loadingService}/>
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white" aria-label="Settings">
              <SettingsIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
        
        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full py-2 px-6 text-sm font-semibold shadow-lg">
            {notification}
          </div>
        )}
        {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-300 mb-6">{error}</div>}

        {isDiscogsConnected && (
          <div className="sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10 py-4 mb-6 flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 items-center">
              <input type="search" placeholder="Search collection..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                {searchTerm && <option value={SortOption.SearchRelevance}>Search Relevance</option>}
                <option value={SortOption.AddedNewest}>Date Added (Newest)</option>
                <option value={SortOption.AddedOldest}>Date Added (Oldest)</option>
                <option value={SortOption.ArtistAZ}>Artist A-Z</option>
                <option value={SortOption.ArtistZA}>Artist Z-A</option>
                <option value={SortOption.AlbumAZ}>Album A-Z</option>
                <option value={SortOption.AlbumZA}>Album Z-A</option>
                <option value={SortOption.YearNewest}>Year (Newest)</option>
                <option value={SortOption.YearOldest}>Year (Oldest)</option>
                <option value={SortOption.FormatAZ}>Format A-Z</option>
                <option value={SortOption.FormatZA}>Format Z-A</option>
                <option value={SortOption.LabelAZ}>Label A-Z</option>
                <option value={SortOption.LabelZA}>Label Z-A</option>
                <option value={SortOption.CatNoAZ}>Catalog# A-Z</option>
                <option value={SortOption.CatNoZA}>Catalog# Z-A</option>
              </select>
              <div className="flex items-center gap-2">
                <label htmlFor="albums-per-row" className="text-sm text-gray-400 whitespace-nowrap">Albums per row:</label>
                <select 
                    id="albums-per-row"
                    value={albumsPerRow} 
                    onChange={(e) => setAlbumsPerRow(Number(e.target.value))} 
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                    {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
                        <option key={num} value={num}>{num}</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={selectedFormat} onChange={e => setSelectedFormat(e.target.value)} className="flex-grow sm:flex-grow-0 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">All Formats ({filterOptions.formats.size})</option> {Array.from(filterOptions.formats.entries()).map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="flex-grow sm:flex-grow-0 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">All Years ({filterOptions.years.size})</option> {Array.from(filterOptions.years.entries()).map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}
              </select>
              {isFiltered && <button onClick={handleResetFilters} className="text-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors">Reset</button>}
              <div className="ml-auto flex items-center gap-4">
                {queueHandler.totalScrobbledAlbums > 0 && (
                  <button 
                    onClick={handleOpenHistory}
                    className="relative text-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
                  >
                    History
                    <div className="absolute -top-1 -right-1 flex items-center">
                      <span className="z-10 relative inline-flex rounded-full h-5 w-5 bg-blue-600 items-center justify-center text-xs font-bold ring-2 ring-gray-900">
                          {queueHandler.totalScrobbledAlbums}
                      </span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-xs font-bold ring-2 ring-gray-900 -ml-2">
                          {queueHandler.totalScrobbledTracks}
                      </span>
                    </div>
                  </button>
                )}
                {collection.length > 0 && (
                  <div className="text-sm text-gray-400 font-semibold">
                      Showing {filteredAndSortedCollection.length} of {collection.length} releases
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <CollectionScreen
          collection={filteredAndSortedCollection}
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
          metadata={appleMusicMetadata}
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
            metadata={appleMusicMetadata}
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