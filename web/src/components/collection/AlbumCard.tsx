import React, { useRef } from 'react';
import type { DiscogsRelease, Settings, CombinedMetadata } from '../../libs';
import { getReleaseDisplayArtist, getReleaseDisplayTitle } from '../../libs';
import { VinylIcon } from '../misc/Icons';

interface AlbumCardProps {
  release: DiscogsRelease;
  onAddInstance: () => void;
  onRemoveLastInstance: () => void;
  onRemoveAllInstances: () => void;
  scrobbleCount: number;
  settings: Settings;
  metadata?: CombinedMetadata;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  release,
  onAddInstance,
  onRemoveLastInstance,
  onRemoveAllInstances,
  scrobbleCount,
  settings,
  metadata
}) => {
  const info = release.basic_information;

  const artistName = getReleaseDisplayArtist(release, metadata, settings);
  const title = getReleaseDisplayTitle(release, metadata, settings);

  const longPressTimerRef = useRef<number | null>(null);
  const wasLongPressRef = useRef(false);

  const handlePressStart = () => {
    wasLongPressRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      onRemoveAllInstances();
      wasLongPressRef.current = true; // Flag that a long press occurred
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleCardClick = () => {
    if (wasLongPressRef.current) {
      wasLongPressRef.current = false;
      return;
    }
    onAddInstance();
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent adding album to queue
    if (wasLongPressRef.current) {
      wasLongPressRef.current = false;
      return;
    }
    onRemoveLastInstance();
  };

  return (
    <div
      className={`aspect-square bg-gray-800 rounded-lg overflow-hidden group relative cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 ${scrobbleCount > 0 ? 'ring-4 ring-blue-500' : 'ring-0 ring-transparent'
        }`}
      onClick={handleCardClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
    >
      {
        info.cover_image && info.cover_image !== 'https://st.discogs.com/images/default-release.png' ? (
          <img
            src={info.cover_image}
            alt={`${artistName} - ${title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <VinylIcon className="w-1/2 h-1/2 text-gray-500" />
          </div>
        )
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-2 sm:p-3 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
        <h3 className="font-bold text-white text-xs sm:text-sm truncate" title={title}>{title}</h3>
        <p className="text-gray-300 text-xs truncate" title={artistName}>{artistName}</p>
      </div>

      {
        scrobbleCount > 0 && (
          <div
            className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 bg-blue-600 text-white font-bold text-xs rounded-full cursor-pointer ring-2 ring-gray-900 z-10 select-none"
            onClick={handleBadgeClick}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            title="Click to remove one. Hold for 0.5s to remove all."
          >
            {scrobbleCount}
          </div>
        )
      }
    </div >
  );
};

export default AlbumCard;
