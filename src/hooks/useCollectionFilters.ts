import { useState, useMemo, useEffect } from 'react';
import type { DiscogsRelease } from '../types';
import { SortOption } from '../types';
import { sortCollection } from './utils/sortCollection';

export function useCollectionFilters(collection: DiscogsRelease[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.AddedNewest);
  const [albumsPerRow, setAlbumsPerRow] = useState<number>(6);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    // When a search is started, default to relevance sort. When cleared, go back to default.
    if (searchTerm && sortOption !== SortOption.SearchRelevance) {
      setSortOption(SortOption.SearchRelevance);
    } else if (!searchTerm && sortOption === SortOption.SearchRelevance) {
      setSortOption(SortOption.AddedNewest);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const filterOptions = useMemo(() => {
    const formats = new Map<string, number>();
    const years = new Map<number, number>();
    collection.forEach(release => {
      release.basic_information.formats?.forEach(f => formats.set(f.name, (formats.get(f.name) || 0) + 1));
      if (release.basic_information.year) years.set(release.basic_information.year, (years.get(release.basic_information.year) || 0) + 1);
    });
    return {
      formats: new Map([...formats.entries()].sort()),
      years: new Map([...years.entries()].sort((a, b) => b[0] - a[0])),
    };
  }, [collection]);

  const filteredAndSortedCollection = useMemo(() => {
    const filtered = collection.filter(release => {
      if (selectedFormat && !release.basic_information.formats?.some(f => f.name === selectedFormat)) return false;
      if (selectedYear && release.basic_information.year?.toString() !== selectedYear) return false;
      const term = searchTerm.toLowerCase();
      if (term) {
        const titleMatch = release.basic_information.title.toLowerCase().includes(term);
        const artistMatch = release.basic_information.artist_display_name.toLowerCase().includes(term);
        if (!titleMatch && !artistMatch) return false;
      }
      return true;
    });

    return sortCollection(filtered, sortOption, searchTerm);
  }, [collection, searchTerm, sortOption, selectedFormat, selectedYear]);
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFormat('');
    setSelectedYear('');
  };

  const isFiltered = !!(searchTerm || selectedFormat || selectedYear);

  return {
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
    filteredAndSortedCollection,
    handleResetFilters,
    isFiltered,
  };
}