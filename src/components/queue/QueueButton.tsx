import React from 'react';
import { VinylIcon } from '../misc/Icons';

interface QueueButtonProps {
  queueCount: number;
  selectedTrackCount: number;
  onClick: () => void;
}

export default function QueueButton({ queueCount, selectedTrackCount, onClick }: QueueButtonProps) {
  if (queueCount === 0) return null;

  const albumText = `${queueCount} ${queueCount === 1 ? 'album' : 'albums'}`;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center gap-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Open queue"
    >
      <VinylIcon className="w-6 h-6" />
      <span className="font-bold whitespace-nowrap">{albumText}</span>
      {selectedTrackCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-xs font-bold">
                  {selectedTrackCount}
              </span>
          </span>
      )}
    </button>
  );
}