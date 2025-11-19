
import React, { useState, useMemo, useEffect } from 'react';
import type { QueueItem as QueueItemType, SelectedTracks, DiscogsRelease, SelectedFeatures, Settings } from '../../types';
import { Loader } from '../misc/Loader';
import { CloseIcon, VinylIcon } from '../misc/Icons';
import QueueItem from './QueueItem';
import { decomposeTimeOffset, formatTimeOffset, TIME_OFFSETS, TimeUnit, MAX_FUTURE_SECONDS, MAX_PAST_SECONDS } from './utils/timeOffsetUtils';

type TimeUnitValue = typeof TimeUnit[keyof typeof TimeUnit];

interface QueueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  queue: QueueItemType[];
  selectedTracks: SelectedTracks;
  selectedFeatures: SelectedFeatures;
  scrobbleTimestamps: Record<number, Record<string, number>>;
  scrobbleTimeOffset: number;
  onScrobbleTimeOffsetChange: (offset: number) => void;
  settings: Settings;
  onTrackToggle: (releaseId: number, trackKey: string) => void;
  onFeatureToggle: (releaseId: number, trackKey: string) => void;
  onToggleParent: (releaseId: number, parentIndex: number, subTrackKeys: string[]) => void;
  onSelectParentAsSingle: (releaseId: number, parentKey: string, subTrackKeys: string[]) => void;
  onSelectAll: (releaseId: number) => void;
  onDeselectAll: (releaseId: number) => void;
  onToggleGroup: (releaseId: number, groupKeys: string[], parentKeysInGroup: string[]) => void;
  onScrobble: () => void;
  isScrobbling: boolean;
  scrobbleError: string | null;
  totalSelectedTracks: number;
  onRemoveAlbumFromQueue: (release: DiscogsRelease) => void;
}

export default function QueueSheet({
  isOpen,
  onClose,
  queue,
  selectedTracks,
  selectedFeatures,
  scrobbleTimestamps,
  scrobbleTimeOffset,
  onScrobbleTimeOffsetChange,
  settings,
  onTrackToggle,
  onFeatureToggle,
  onToggleParent,
  onSelectParentAsSingle,
  onSelectAll,
  onDeselectAll,
  onToggleGroup,
  onScrobble,
  isScrobbling,
  scrobbleError,
  totalSelectedTracks,
  onRemoveAlbumFromQueue,
}: QueueSheetProps) {
  const [isEditingTimeOffset, setIsEditingTimeOffset] = useState(false);
  const decomposed = useMemo(() => decomposeTimeOffset(scrobbleTimeOffset), [scrobbleTimeOffset]);
  const [editedTimeValue, setEditedTimeValue] = useState(decomposed.value);
  const [editedTimeUnit, setEditedTimeUnit] = useState<TimeUnitValue>(decomposed.unit);

  useEffect(() => {
    if (!isEditingTimeOffset) {
        const { value, unit } = decomposeTimeOffset(scrobbleTimeOffset);
        setEditedTimeValue(value);
        setEditedTimeUnit(unit);
    }
  }, [scrobbleTimeOffset, isEditingTimeOffset]);

  const handleTimeEditCommit = () => {
    let multiplier = 60;
    if (editedTimeUnit === TimeUnit.HOUR) multiplier = 3600;
    if (editedTimeUnit === TimeUnit.DAY) multiplier = 86400;
    
    let totalSeconds = Math.round(editedTimeValue * multiplier);
    
    totalSeconds = Math.max(totalSeconds, -MAX_PAST_SECONDS);
    totalSeconds = Math.min(totalSeconds, MAX_FUTURE_SECONDS);

    onScrobbleTimeOffsetChange(totalSeconds);
    setIsEditingTimeOffset(false);
  };
  
  const handleTimeEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimeEditCommit();
    } else if (e.key === 'Escape') {
      setIsEditingTimeOffset(false);
    }
  };

  const sliderIndex = useMemo(() => {
    if (scrobbleTimeOffset === 0) return TIME_OFFSETS.findIndex(t => t.value === 0);
    const closestIndex = TIME_OFFSETS.reduce((prevIndex, curr, currIndex) => {
        const prevValue = TIME_OFFSETS[prevIndex].value;
        const prevDistance = Math.abs(prevValue - scrobbleTimeOffset);
        const currDistance = Math.abs(curr.value - scrobbleTimeOffset);
        return currDistance < prevDistance ? currIndex : prevIndex;
    }, 0);
    return closestIndex;
  }, [scrobbleTimeOffset]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    const offset = TIME_OFFSETS[index].value;
    onScrobbleTimeOffsetChange(offset);
  };

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
            <h2 className="text-xl font-bold">Scrobble Queue ({queue.length})</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto space-y-4">
          {queue.length > 0 ? (
            queue.map(item => (
              <QueueItem
                key={item.id}
                item={item}
                selectedTrackKeys={new Set(selectedTracks[item.id] || [])}
                selectedFeatures={new Set(selectedFeatures[item.id] || [])}
                scrobbleTimestamps={scrobbleTimestamps[item.id] || {}}
                settings={settings}
                onToggle={(trackKey) => onTrackToggle(item.id, trackKey)}
                onFeatureToggle={(trackKey) => onFeatureToggle(item.id, trackKey)}
                onToggleParent={(parentIndex, subTrackKeys) => onToggleParent(item.id, parentIndex, subTrackKeys)}
                onSelectParentAsSingle={(parentKey, subTrackKeys) => onSelectParentAsSingle(item.id, parentKey, subTrackKeys)}
                onSelectAll={() => onSelectAll(item.id)}
                onDeselectAll={() => onDeselectAll(item.id)}
                onToggleGroup={(groupKeys, parentKeys) => onToggleGroup(item.id, groupKeys, parentKeys)}
                onRemoveAlbumFromQueue={() => onRemoveAlbumFromQueue(item)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>Your queue is empty.</p>
              <p className="text-sm">Select albums from your collection to add them here.</p>
            </div>
          )}
        </main>

        <footer className="p-4 border-t border-gray-700 flex-shrink-0 flex flex-col gap-2">
            <div className="grid grid-cols-[auto,1fr] items-center gap-4">
                <span className="font-semibold text-gray-300">When?</span>
                <input
                    type="range"
                    min="0"
                    max={TIME_OFFSETS.length - 1}
                    value={sliderIndex}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="flex justify-end h-6 items-center">
                {isEditingTimeOffset ? (
                    <div
                        className="flex items-center gap-2"
                        onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                handleTimeEditCommit();
                            }
                        }}
                    >
                        <input
                            type="number"
                            value={editedTimeValue}
                            onChange={(e) => setEditedTimeValue(Number(e.target.value))}
                            onKeyDown={handleTimeEditKeyDown}
                            autoFocus
                            className="bg-gray-700 text-gray-200 text-sm text-right px-2 py-1 rounded-md w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <select
                            value={editedTimeUnit}
                            onChange={(e) => setEditedTimeUnit(e.target.value as TimeUnitValue)}
                            className="bg-gray-700 text-gray-200 text-sm px-1 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={TimeUnit.MINUTE}>minutes</option>
                            <option value={TimeUnit.HOUR}>hours</option>
                            <option value={TimeUnit.DAY}>days</option>
                        </select>
                    </div>
                ) : (
                    <p
                        onClick={() => setIsEditingTimeOffset(true)}
                        className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors"
                        title="Click to edit precisely"
                    >
                        {formatTimeOffset(scrobbleTimeOffset)}
                    </p>
                )}
            </div>

            {scrobbleError && <p className="text-red-400 text-sm text-center">{scrobbleError}</p>}
            
            <button
                onClick={onScrobble}
                disabled={isScrobbling || totalSelectedTracks === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isScrobbling ? <Loader /> : `Scrobble ${totalSelectedTracks} ${totalSelectedTracks === 1 ? 'Track' : 'Tracks'}`}
            </button>
        </footer>
      </div>
    </div>
  );
}
