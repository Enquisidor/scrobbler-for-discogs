import React from 'react';
import type { DiscogsRelease } from '../../types';
import { VinylIcon } from '../misc/Icons';

interface AlbumCardProps {
  release: DiscogsRelease;
  onClick: () => void;
  isSelected: boolean;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ release, onClick, isSelected }) => {
  const info = release.basic_information;
  const artistName = info.artist_display_name;

  return (
    <div 
      className={`aspect-square bg-gray-800 rounded-lg overflow-hidden group relative cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 ${
        isSelected ? 'ring-4 ring-blue-500' : 'ring-0 ring-transparent'
      }`}
      onClick={onClick}
    >
      {info.cover_image && info.cover_image !== 'https://st.discogs.com/images/default-release.png' ? (
        <img
          src={info.cover_image}
          alt={`${artistName} - ${info.title}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <VinylIcon className="w-1/2 h-1/2 text-gray-500"/>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 p-2 sm:p-3 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-bold text-white text-xs sm:text-sm truncate" title={info.title}>{info.title}</h3>
        <p className="text-gray-300 text-xs truncate" title={artistName}>{artistName}</p>
      </div>
    </div>
  );
};

export default AlbumCard;