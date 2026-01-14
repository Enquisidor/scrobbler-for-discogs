import React, { useState, useMemo, useEffect } from 'react';
import { Loader } from '../misc/Loader';
import { decomposeTimeOffset, formatTimeOffset, TIME_OFFSETS, TimeUnit, MAX_FUTURE_SECONDS, MAX_PAST_SECONDS } from './utils/timeOffsetUtils';

type TimeUnitValue = typeof TimeUnit[keyof typeof TimeUnit];

interface QueueScrobblerProps {
  scrobbleTimeOffset: number;
  onScrobbleTimeOffsetChange: (offset: number) => void;
  scrobbleError: string | null;
  onScrobble: () => void;
  isLastfmConnected: boolean;
  isScrobbling: boolean;
  totalSelectedTracks: number;
}

const QueueScrobbler: React.FC<QueueScrobblerProps> = ({
  scrobbleTimeOffset,
  onScrobbleTimeOffsetChange,
  scrobbleError,
  onScrobble,
  isLastfmConnected,
  isScrobbling,
  totalSelectedTracks,
}) => {
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

  return (
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
        disabled={!isLastfmConnected || isScrobbling || totalSelectedTracks === 0}
        className="w-full bg-brand-lastfm hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors disabled:bg-brand-lastfm disabled:text-gray-900 disabled:cursor-not-allowed"
        title={!isLastfmConnected ? "Connect Last.fm to scrobble" : ""}
      >
        {isScrobbling ? <Loader /> : `Scrobble ${totalSelectedTracks} ${totalSelectedTracks === 1 ? 'Track' : 'Tracks'}`}
      </button>
    </footer>
  );
};

export default QueueScrobbler;