import React from 'react';
import type { DiscogsRelease, QueueItem } from '../../types';
import AlbumCard from './AlbumCard';
import { Loader } from '../misc/Loader';
import { DiscogsIcon } from '../misc/Icons';

interface CollectionScreenProps {
  collection: DiscogsRelease[];
  queue: QueueItem[];
  isLoading: boolean;
  isSyncing: boolean;
  isFiltered: boolean;
  albumsPerRow: number;
  loadingProgress: { current: number; total: number };
  onToggleAlbumInQueue: (release: DiscogsRelease) => void;
  onConnectDiscogs: () => void;
  isConnectingDiscogs: boolean;
}

export default function CollectionScreen({
  collection,
  queue,
  isLoading,
  isSyncing,
  isFiltered,
  albumsPerRow,
  loadingProgress,
  onToggleAlbumInQueue,
  onConnectDiscogs,
  isConnectingDiscogs,
}: CollectionScreenProps) {
  const isDiscogsConnected = collection.length > 0 || isSyncing || isLoading;
  const queuedReleaseIds = new Set((queue || []).map(item => item.id));

  return (
    <main>
      {isDiscogsConnected ? (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <Loader />
              <p className="mt-4 text-lg text-gray-300">Loading your collection...</p>
              {loadingProgress.total > 1 && (
                <p className="text-sm text-gray-500">
                  Fetching page {loadingProgress.current} of {loadingProgress.total}
                </p>
              )}
            </div>
          ) : collection.length > 0 ? (
            <div 
              className="grid gap-4" 
              style={{ gridTemplateColumns: `repeat(${albumsPerRow}, minmax(0, 1fr))` }}
            >
              {collection.map(release => (
                <AlbumCard
                  key={release.instance_id}
                  release={release}
                  onClick={() => onToggleAlbumInQueue(release)}
                  isSelected={queuedReleaseIds.has(release.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center col-span-full py-20">
              <p className="text-gray-500">
                {isFiltered ? "No albums match your filters." : "Your collection appears to be empty."}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-[60vh]">
          <DiscogsIcon className="w-16 h-16 mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white">View Your Collection</h2>
          <p className="text-gray-400 mt-2 mb-6 max-w-md">
            To get started, connect your Discogs account. This will allow Vinyl Scrobbler to load and display your
            record collection.
          </p>
          <button
            onClick={onConnectDiscogs}
            disabled={isConnectingDiscogs}
            className="flex items-center justify-center gap-2 w-64 py-3 px-4 bg-brand-discogs text-white font-semibold rounded-md hover:bg-black disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isConnectingDiscogs ? <Loader /> : <><DiscogsIcon className="w-5 h-5" /> Connect Discogs</>}
          </button>
        </div>
      )}
    </main>
  );
}