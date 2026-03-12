import React from 'react';
import { VinylIcon } from '../misc/Icons';
import type { QueueItem, SelectedTracks } from '../../libs';

interface QueueButtonProps {
  queue: QueueItem[];
  selectedTracks: SelectedTracks;
  queueCount: number;
  selectedTrackCount: number;
  onClick: () => void;
}

const MAX_ART_CIRCLES = 5;

export default function QueueButton({ queue, selectedTracks, queueCount, selectedTrackCount, onClick }: QueueButtonProps) {
  if (queueCount === 0) {
    return null;
  }

  const displayedItems = queue.slice(-MAX_ART_CIRCLES);

  return (
    <div className="fixed bottom-6 right-6 z-30 flex items-center">
      {/* Album art circles extending to the left, each overlapping the previous */}
      {displayedItems.map((item, i) => {
        const selectedCount = selectedTracks[item.instanceKey]?.size ?? 0;
        const thumb = item.basic_information.thumb;
        return (
          <div
            key={item.instanceKey}
            className="relative flex-shrink-0"
            style={{ marginLeft: i > 0 ? '-10px' : 0, zIndex: i + 1 }}
          >
            {thumb ? (
              <img
                src={thumb}
                className="w-9 h-9 rounded-full ring-2 ring-gray-900 object-cover bg-gray-700"
                alt=""
              />
            ) : (
              <div className="w-9 h-9 rounded-full ring-2 ring-gray-900 bg-gray-700" />
            )}
            {selectedCount > 0 && (
              <span className="absolute -top-1 -left-1 inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-bold ring-1 ring-gray-900 pointer-events-none">
                {selectedCount}
              </span>
            )}
          </div>
        );
      })}

      {/* Main queue button — overlaps the last circle just like circles overlap each other */}
      <button
        onClick={onClick}
        className="relative bg-gray-700 hover:bg-gray-600 text-white rounded-full p-4 shadow-lg flex items-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{ marginLeft: displayedItems.length > 0 ? '-10px' : 0, zIndex: displayedItems.length + 1 }}
        aria-label="Open queue"
      >
        <VinylIcon className="w-6 h-6" />

        {/* Red bubble (selected track count) on the top-LEFT */}
        {selectedTrackCount > 0 && (
          <span className="absolute -top-1 -left-1 inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-xs font-bold ring-2 ring-gray-900">
            {selectedTrackCount}
          </span>
        )}

        {/* Blue bubble (album count) on the top-RIGHT */}
        <span className="absolute -top-1 -right-1 inline-flex rounded-full h-6 w-6 bg-blue-600 items-center justify-center text-xs font-bold ring-2 ring-gray-900">
          {queueCount}
        </span>
      </button>
    </div>
  );
}
