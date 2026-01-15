

import React from 'react';
import { SortOption } from '../../libs';

interface CollectionFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sortOption: SortOption;
  setSortOption: (value: SortOption) => void;
  albumsPerRow: number;
  setAlbumsPerRow: (value: number) => void;
  selectedFormat: string;
  setSelectedFormat: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  filterOptions: {
    formats: Map<string, number>;
    years: Map<number, number>;
  };
  isFiltered: boolean;
  handleResetFilters: () => void;
  totalScrobbledAlbums: number;
  totalScrobbledTracks: number;
  handleOpenHistory: () => void;
  totalFilteredCount: number;
  displayedCount: number;
}

const CollectionFilters: React.FC<CollectionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  albumsPerRow,
  setAlbumsPerRow,
  selectedFormat,
  setSelectedFormat,
  selectedYear,
  setSelectedYear,
  filterOptions,
  isFiltered,
  handleResetFilters,
  totalScrobbledAlbums,
  totalScrobbledTracks,
  handleOpenHistory,
  totalFilteredCount,
  displayedCount,
}) => {
  return (
    <div className="sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10 py-4 mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="search"
          placeholder="Search collection..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {searchTerm && <option value={SortOption.SearchRelevance}>Search Relevance</option>}
          <option value={SortOption.AddedNewest}>Date Added (Newest)</option>
          <option value={SortOption.AddedOldest}>Date Added (Oldest)</option>
          <option value={SortOption.ArtistAZ}>Artist A-Z</option>
          <option value={SortOption.ArtistZA}>Artist Z-A</option>
          <option value={SortOption.AlbumAZ}>Album A-Z</option>
          <option value={SortOption.AlbumZA}>Album Z-A</option>
          <option value={SortOption.YearNewest}>Year (Newest)</option>
          <option value={SortOption.YearOldest}>Year (Oldest)</option>
          <option value={SortOption.FormatAZ}>Format A-Z</option>
          <option value={SortOption.FormatZA}>Format Z-A</option>
          <option value={SortOption.LabelAZ}>Label A-Z</option>
          <option value={SortOption.LabelZA}>Label Z-A</option>
          <option value={SortOption.CatNoAZ}>Catalog# A-Z</option>
          <option value={SortOption.CatNoZA}>Catalog# Z-A</option>
        </select>
        <div className="flex items-center gap-2">
          <label htmlFor="albums-per-row" className="text-sm text-gray-400 whitespace-nowrap">
            Albums per row:
          </label>
          <select
            id="albums-per-row"
            value={albumsPerRow}
            onChange={(e) => setAlbumsPerRow(Number(e.target.value))}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="flex-grow sm:flex-grow-0 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">All Formats ({filterOptions.formats.size})</option>{' '}
          {Array.from(filterOptions.formats.entries()).map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="flex-grow sm:flex-grow-0 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">All Years ({filterOptions.years.size})</option>{' '}
          {Array.from(filterOptions.years.entries()).map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>
        {isFiltered && (
          <button
            onClick={handleResetFilters}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            Reset
          </button>
        )}
        <div className="ml-auto flex items-center gap-4">
          {totalScrobbledAlbums > 0 && (
            <button
              onClick={handleOpenHistory}
              className="relative text-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
            >
              History
              <div className="absolute -top-1 -right-1 flex items-center">
                <span className="z-10 relative inline-flex rounded-full h-5 w-5 bg-blue-600 items-center justify-center text-xs font-bold ring-2 ring-gray-900">
                  {totalScrobbledAlbums}
                </span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-xs font-bold ring-2 ring-gray-900 -ml-2">
                  {totalScrobbledTracks}
                </span>
              </div>
            </button>
          )}
          {totalFilteredCount > 0 && (
            <div className="text-sm text-gray-400 font-semibold">
              Showing {displayedCount} / {totalFilteredCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionFilters;
