/**
 * useCollectionFilters - Manages search, filtering, and sorting of the collection
 *
 * Provides:
 * - Fuzzy search across title and artist (0.6 threshold)
 * - Format and year filtering
 * - Automatic sort switching to SearchRelevance when searching
 * - Memoized filter options derived from collection
 */
import { useState, useMemo, useEffect } from 'react';
import type { DiscogsRelease, SortOption } from '@libs';
import { SortOption as SortOptionEnum, sortCollection, calculateFuzzyScore } from '@libs';

const FUZZY_SEARCH_THRESHOLD = 0.6;

export interface FilterOptions {
  formats: Map<string, number>;
  years: Map<number, number>;
}

export function useCollectionFilters(
  collection: DiscogsRelease[],
  sortOption: SortOption,
  setSortOption: (option: SortOption) => void
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // When a search is started, default to relevance sort. When cleared, go back to default.
  useEffect(() => {
    if (searchTerm && sortOption !== SortOptionEnum.SearchRelevance) {
      setSortOption(SortOptionEnum.SearchRelevance);
    } else if (!searchTerm && sortOption === SortOptionEnum.SearchRelevance) {
      setSortOption(SortOptionEnum.AddedNewest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Derive available filter options from collection
  const filterOptions = useMemo((): FilterOptions => {
    const formats = new Map<string, number>();
    const years = new Map<number, number>();

    collection.forEach(release => {
      release.basic_information.formats?.forEach(f => {
        formats.set(f.name, (formats.get(f.name) || 0) + 1);
      });
      if (release.basic_information.year) {
        years.set(
          release.basic_information.year,
          (years.get(release.basic_information.year) || 0) + 1
        );
      }
    });

    return {
      formats: new Map([...formats.entries()].sort()),
      years: new Map([...years.entries()].sort((a, b) => b[0] - a[0])),
    };
  }, [collection]);

  // Filter and sort the collection
  const filteredAndSortedCollection = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    const filtered = collection.filter(release => {
      // Format filter
      if (selectedFormat && !release.basic_information.formats?.some(f => f.name === selectedFormat)) {
        return false;
      }

      // Year filter
      if (selectedYear && release.basic_information.year?.toString() !== selectedYear) {
        return false;
      }

      // Search filter (exact + fuzzy)
      if (lowerSearchTerm) {
        const title = release.basic_information.title.toLowerCase();
        const artist = release.basic_information.artist_display_name.toLowerCase();

        // 1. Exact match (Fast)
        if (title.includes(lowerSearchTerm) || artist.includes(lowerSearchTerm)) {
          return true;
        }

        // 2. Fuzzy match (Slower, handles typos)
        const titleScore = calculateFuzzyScore(lowerSearchTerm, title);
        const artistScore = calculateFuzzyScore(lowerSearchTerm, artist);

        return Math.max(titleScore, artistScore) > FUZZY_SEARCH_THRESHOLD;
      }

      return true;
    });

    // Sort locally to ensure chunks are ordered correctly and support search relevance
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
