
import { useState, useMemo, useEffect } from 'react';
import type { DiscogsRelease } from 'scrobbler-for-discogs-libs';
import { SortOption } from 'scrobbler-for-discogs-libs';
import { sortCollection } from '../utils/sortCollection';
import { calculateFuzzyScore } from '../utils/fuzzyUtils';

export function useCollectionFilters(
    collection: DiscogsRelease[], 
    sortOption: SortOption, 
    setSortOption: (option: SortOption) => void
) {
  const [searchTerm, setSearchTerm] = useState('');
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
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const filtered = collection.filter(release => {
      if (selectedFormat && !release.basic_information.formats?.some(f => f.name === selectedFormat)) return false;
      if (selectedYear && release.basic_information.year?.toString() !== selectedYear) return false;
      
      if (lowerSearchTerm) {
        const title = release.basic_information.title.toLowerCase();
        const artist = release.basic_information.artist_display_name.toLowerCase();
        
        // 1. Exact match (Fast)
        if (title.includes(lowerSearchTerm) || artist.includes(lowerSearchTerm)) {
            return true;
        }
        
        // 2. Fuzzy match (Slower, handles typos)
        // Threshold of 0.6 handles decent typos (e.g. "Beetles" -> "Beatles")
        // We check tokens, so searching "Beat" finds "The Beatles"
        const titleScore = calculateFuzzyScore(lowerSearchTerm, title);
        const artistScore = calculateFuzzyScore(lowerSearchTerm, artist);
        
        return Math.max(titleScore, artistScore) > 0.6;
      }
      return true;
    });

    // Even though we do server-side sort, we sort locally too to ensure 
    // the chunks we have are ordered correctly (and to support search relevance)
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
