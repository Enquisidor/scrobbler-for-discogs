import React, { useMemo } from 'react';
import type { QueueItem as QueueItemType, SelectedTracks, SelectedFeatures, Settings, ArtistSelections, CombinedMetadata } from '@libs';
import { CloseIcon, VinylIcon } from '../misc/Icons';
import QueueItem from './QueueItem';
import QueueScrobbler from './QueueScrobbler';

// --- Prop interfaces for decomposed components ---

// Domain: State and handlers for track/feature/artist selections and actions
interface QueueSelectionProps {
  selectedTracks: SelectedTracks;
  selectedFeatures: SelectedFeatures;
  artistSelections: ArtistSelections;
  onTrackToggle: (instanceKey: string, trackKey: string) => void;
  onFeatureToggle: (instanceKey: string, trackKey: string) => void;
  onArtistToggle: (instanceKey: string, trackKey: string, artistName: string) => void;
  onToggleParent: (instanceKey: string, parentIndex: number, subTrackKeys: string[]) => void;
  onSelectParentAsSingle: (instanceKey: string, parentKey: string, subTrackKeys: string[]) => void;
  onSelectAll: (instanceKey: string) => void;
  onDeselectAll: (instanceKey: string) => void;
  onToggleGroup: (instanceKey: string, groupKeys: string[], parentKeysInGroup: string[]) => void;
  onScrobbleModeToggle?: (instanceKey: string, useTrackArtist: boolean) => void;
  onRemoveAlbumInstanceFromQueue: (instanceKey: string) => void;
  onScrobbleSingleRelease: (instanceKey: string) => void;
  metadata: Record<number, CombinedMetadata>;
  scrobbleTimestamps: Record<string, Record<string, number>>;
  settings: Settings;
}

// Composite type for all props that are passed through QueueSheet to QueueList
interface QueueListPassthroughProps extends QueueSelectionProps {}

interface QueueListProps extends QueueListPassthroughProps {
  view: 'queue' | 'history';
  itemsToDisplay: QueueItemType[];
  isScrobbling: boolean;
}

// --- Decomposed Local Components ---

const QueueList: React.FC<QueueListProps> = ({
  view,
  itemsToDisplay,
  isScrobbling,
  // Passthrough props are destructured here for use
  selectedTracks,
  selectedFeatures,
  artistSelections,
  scrobbleTimestamps,
  settings,
  metadata,
  onTrackToggle,
  onFeatureToggle,
  onArtistToggle,
  onToggleParent,
  onSelectParentAsSingle,
  onSelectAll,
  onDeselectAll,
  onToggleGroup,
  onRemoveAlbumInstanceFromQueue,
  onScrobbleModeToggle,
  onScrobbleSingleRelease,
}) => {
  return (
    <main className="flex-grow p-4 overflow-y-auto space-y-4">
      {itemsToDisplay.length > 0 ? (
        itemsToDisplay.map(item => (
          <QueueItem
            key={item.instanceKey}
            item={item}
            selectedTrackKeys={new Set(selectedTracks[item.instanceKey] || [])}
            selectedFeatures={new Set(selectedFeatures[item.instanceKey] || [])}
            artistSelections={artistSelections[item.instanceKey] || {}}
            scrobbleTimestamps={scrobbleTimestamps[item.instanceKey] || {}}
            settings={settings}
            metadata={metadata[item.id]}
            onToggle={(trackKey) => onTrackToggle(item.instanceKey, trackKey)}
            onFeatureToggle={(trackKey) => onFeatureToggle(item.instanceKey, trackKey)}
            onArtistToggle={(trackKey, artistName) => onArtistToggle(item.instanceKey, trackKey, artistName)}
            onToggleParent={(parentIndex, subTrackKeys) => onToggleParent(item.instanceKey, parentIndex, subTrackKeys)}
            onSelectParentAsSingle={(parentKey, subTrackKeys) => onSelectParentAsSingle(item.instanceKey, parentKey, subTrackKeys)}
            onSelectAll={() => onSelectAll(item.instanceKey)}
            onDeselectAll={() => onDeselectAll(item.instanceKey)}
            onToggleGroup={(groupKeys, parentKeys) => onToggleGroup(item.instanceKey, groupKeys, parentKeys)}
            onRemoveAlbumInstanceFromQueue={() => onRemoveAlbumInstanceFromQueue(item.instanceKey)}
            onScrobbleModeToggle={(useTrackArtist) => onScrobbleModeToggle?.(item.instanceKey, useTrackArtist)}
            isHistoryItem={view === 'history'}
            onScrobbleSingleRelease={() => onScrobbleSingleRelease(item.instanceKey)}
            isScrobbling={isScrobbling}
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p>{view === 'queue' ? 'Your queue is empty.' : 'Your scrobble history for this session is empty.'}</p>
          <p className="text-sm">Select albums from your collection to add them here.</p>
        </div>
      )}
    </main>
  );
}

// --- Main QueueSheet Component ---

interface QueueSheetProps extends QueueListPassthroughProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'queue' | 'history';
  queue: QueueItemType[];
  scrobbledHistory: QueueItemType[];
  isLastfmConnected: boolean;
  totalSelectedTracks: number;
  isScrobbling: boolean;
  scrobbleError: string | null;
  onScrobble: () => void;
  scrobbleTimeOffset: number;
  onScrobbleTimeOffsetChange: (offset: number) => void;
}

export default function QueueSheet({
  // Props for QueueSheet and its children, excluding what's passed through
  isOpen,
  onClose,
  view,
  queue,
  scrobbledHistory,
  isLastfmConnected,
  totalSelectedTracks,
  isScrobbling,
  scrobbleError,
  onScrobble,
  scrobbleTimeOffset,
  onScrobbleTimeOffsetChange,
  // All other props conforming to QueueListPassthroughProps are collected here
  ...passthroughProps
}: QueueSheetProps) {
  const itemsToDisplay = view === 'queue' ? queue : scrobbledHistory;
  
  const totalScrobbledAlbums = scrobbledHistory.length;
  const totalScrobbledTracks = useMemo(() => {
    return scrobbledHistory.reduce((acc, item) => acc + (item.scrobbledTrackCount || 0), 0);
  }, [scrobbledHistory]);

  const title = view === 'queue' 
    ? `Scrobble Queue (${queue.length})` 
    : `Scrobbled History (${totalScrobbledAlbums} Albums, ${totalScrobbledTracks} Tracks)`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-end" onClick={onClose}>
      <div 
        className="bg-gray-900 w-full max-w-4xl mx-auto h-[90vh] rounded-t-2xl flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <VinylIcon className="w-6 h-6 text-gray-300"/>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <QueueList
          view={view}
          itemsToDisplay={itemsToDisplay}
          isScrobbling={isScrobbling}
          {...passthroughProps}
        />

        {view === 'queue' && (
          <QueueScrobbler
            isLastfmConnected={isLastfmConnected}
            isScrobbling={isScrobbling}
            totalSelectedTracks={totalSelectedTracks}
            scrobbleError={scrobbleError}
            onScrobble={onScrobble}
            scrobbleTimeOffset={scrobbleTimeOffset}
            onScrobbleTimeOffsetChange={onScrobbleTimeOffsetChange}
          />
        )}
      </div>
    </div>
  );
}