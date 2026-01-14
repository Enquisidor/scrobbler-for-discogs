import React, { useEffect, useRef, useMemo } from 'react';
import type { DiscogsRelease, QueueItem, Settings, CombinedMetadata } from '../../types';
import AlbumCard from './AlbumCard';
import { Loader } from '../misc/Loader';
import { DiscogsIcon } from '../misc/Icons';

interface CollectionScreenProps {
  collection: DiscogsRelease[];
  queue: QueueItem[];
  isLoading: boolean;
  isSyncing: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isFiltered: boolean;
  albumsPerRow: number;
  onAddAlbumToQueue: (release: DiscogsRelease) => void;
  onRemoveLastInstanceOfAlbumFromQueue: (releaseId: number) => void;
  onRemoveAllInstancesOfAlbumFromQueue: (releaseId: number) => void;
  onConnectDiscogs: () => void;
  isConnectingDiscogs: boolean;
  settings: Settings;
  metadata: Record<number, CombinedMetadata>;
}

export default function CollectionScreen({
  collection,
  queue,
  isLoading,
  isSyncing,
  hasMore,
  onLoadMore,
  isFiltered,
  albumsPerRow,
  onAddAlbumToQueue,
  onRemoveLastInstanceOfAlbumFromQueue,
  onRemoveAllInstancesOfAlbumFromQueue,
  onConnectDiscogs,
  isConnectingDiscogs,
  settings,
  metadata
}: CollectionScreenProps) {
  const isDiscogsConnected = collection.length > 0 || isSyncing || isLoading;
  
  const queueCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const item of queue) {
      counts.set(item.id, (counts.get(item.id) || 0) + 1);
    }
    return counts;
  }, [queue]);

  // Intersection Observer for Infinite Scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      {
          threshold: 0.1,
          rootMargin: '1200px'
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, onLoadMore]);

  return (
    <main>
      {isDiscogsConnected ? (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <Loader />
              <p className="mt-4 text-lg text-gray-300">Loading your collection...</p>
            </div>
          ) : collection.length > 0 ? (
            <div className="flex flex-col">
                <div 
                className="grid gap-4" 
                style={{ gridTemplateColumns: `repeat(${albumsPerRow}, minmax(0, 1fr))` }}
                >
                {collection.map(release => (
                    <AlbumCard
                      key={release.instance_id}
                      release={release}
                      scrobbleCount={queueCounts.get(release.id) || 0}
                      onAddInstance={() => onAddAlbumToQueue(release)}
                      onRemoveLastInstance={() => onRemoveLastInstanceOfAlbumFromQueue(release.id)}
                      onRemoveAllInstances={() => onRemoveAllInstancesOfAlbumFromQueue(release.id)}
                      settings={settings}
                      metadata={metadata[release.id]}
                    />
                ))}
                </div>
                
                {/* Infinite Scroll Sentinel / Loader */}
                <div ref={loadMoreRef} className="flex justify-center py-8">
                    {hasMore && <Loader />}
                </div>
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
            To get started, connect your Discogs account. This will allow this scrobbler to load and display your
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