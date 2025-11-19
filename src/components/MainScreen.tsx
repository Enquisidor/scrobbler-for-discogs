import React, { useState, useRef, useEffect } from 'react';
import type { Credentials, Settings } from '../types';
import { SortOption } from '../types';
import CollectionScreen from './collection/CollectionScreen';
import QueueButton from './queue/QueueButton';
import QueueSheet from './queue/QueueSheet';
import SettingsSheet from './settings/SettingsSheet';
import { useAuthHandler } from '../hooks/useAuthHandler';
import { useDiscogsCollection } from '../hooks/useDiscogsCollection';
import { useCollectionFilters } from '../hooks/useCollectionFilters';
import { useQueueHandler } from '../hooks/useQueueHandler';
import ConnectionButton from './misc/ConnectionButton';
import { Loader } from './misc/Loader';
import { SettingsIcon } from './misc/Icons';

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
  const isLastfmConnected = !!credentials.lastfmSessionKey;
  
  // Custom Hooks for Logic and State Management
  const { 
    loadingService, 
    error: authError, 
    handleDiscogsConnect,
    handleLastfmConnect,
  } = useAuthHandler(credentials, onCredentialsChange);
  
  const { 
    collection, 
    isLoading: isCollectionLoading, 
    isSyncing, 
    loadingProgress, 
    error: collectionError,
  } = useDiscogsCollection(credentials, isDiscogsConnected);
  
  const {
    searchTerm, setSearchTerm,
    sortOption, setSortOption,
    albumsPerRow, setAlbumsPerRow,
    selectedFormat, setSelectedFormat,
    selectedYear, setSelectedYear,
    filterOptions,
    filteredAndSortedCollection,
    handleResetFilters,
    isFiltered,
  } = useCollectionFilters(collection);

  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<number | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleQueueSuccess = (message: string) => {
    setIsQueueOpen(false);
    setNotification(message);
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = window.setTimeout(() => setNotification(null), 5000);
  };
  
  const {
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
      handleTrackToggle,
      handleFeatureToggle,
      handleToggleParent,
      handleSelectParentAsSingle,
      handleSelectAll,
      handleDeselectAll,
      handleToggleGroup,
      handleScrobble,
  } = useQueueHandler(credentials, settings, handleQueueSuccess);

  const error = authError || collectionError;
  
  useEffect(() => () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); }, []);
  
  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold">Vinyl Scrobbler</h1>
            {isSyncing && <div title="Syncing collection..." className="self-center"><Loader /></div>}
          </div>
          <div className="flex items-center gap-2">
            <ConnectionButton service="discogs" isConnected={isDiscogsConnected} username={credentials.discogsUsername} onConnect={handleDiscogsConnect} onDisconnect={onDiscogsLogout} isLoading={loadingService === 'discogs'} isDisabled={!!loadingService}/>
            <ConnectionButton service="lastfm" isConnected={isLastfmConnected} username={credentials.lastfmUsername} onConnect={handleLastfmConnect} onDisconnect={onLastfmLogout} isLoading={loadingService === 'lastfm'} isDisabled={!!loadingService}/>
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
                <option value={SortOption.LabelAZ}>Label A-Z</option>
                <option value={SortOption.LabelZA}>Label Z-A</option>
                <option value={SortOption.FormatAZ}>Format A-Z</option>
                <option value={SortOption.FormatZA}>Format Z-A</option>
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
              {collection.length > 0 && (
                <div className="ml-auto text-sm text-gray-400 font-semibold">
                    Showing {filteredAndSortedCollection.length} of {collection.length} releases
                </div>
              )}
            </div>
          </div>
        )}
        
        <CollectionScreen
          collection={filteredAndSortedCollection}
          queue={queue}
          isLoading={isCollectionLoading}
          isSyncing={isSyncing}
          isFiltered={isFiltered}
          albumsPerRow={albumsPerRow}
          loadingProgress={loadingProgress}
          onToggleAlbumInQueue={toggleAlbumInQueue}
          onConnectDiscogs={handleDiscogsConnect}
          isConnectingDiscogs={loadingService === 'discogs'}
        />
      </div>

      <SettingsSheet 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      {isDiscogsConnected && isLastfmConnected && (
        <>
          <QueueButton
            queueCount={queue.length}
            selectedTrackCount={totalSelectedTracks}
            onClick={() => setIsQueueOpen(true)}
          />
          <QueueSheet
            isOpen={isQueueOpen}
            onClose={() => setIsQueueOpen(false)}
            queue={queue}
            selectedTracks={selectedTracks}
            selectedFeatures={selectedFeatures}
            scrobbleTimestamps={scrobbleTimestamps}
            scrobbleTimeOffset={scrobbleTimeOffset}
            onScrobbleTimeOffsetChange={setScrobbleTimeOffset}
            settings={settings}
            onTrackToggle={handleTrackToggle}
            onFeatureToggle={handleFeatureToggle}
            onToggleParent={handleToggleParent}
            onSelectParentAsSingle={handleSelectParentAsSingle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onToggleGroup={handleToggleGroup}
            onScrobble={handleScrobble}
            isScrobbling={isScrobbling}
            scrobbleError={scrobbleError}
            totalSelectedTracks={totalSelectedTracks}
            onRemoveAlbumFromQueue={toggleAlbumInQueue}
          />
        </>
      )}
    </>
  );
}