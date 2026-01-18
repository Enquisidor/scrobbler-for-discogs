/**
 * CollectionFilters - Search, sort, and filter controls for the collection
 *
 * Provides:
 * - Search input with fuzzy matching
 * - Sort picker with 15 options
 * - Format and year filter pickers
 * - Reset button when filters are active
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import type { SortOption } from '@libs';
import { SortOption as SortOptionEnum, STRINGS } from '@libs';
import type { FilterOptions } from '../../hooks/useCollection/useCollectionFilters';

interface CollectionFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sortOption: SortOption;
  setSortOption: (value: SortOption) => void;
  selectedFormat: string;
  setSelectedFormat: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  filterOptions: FilterOptions;
  isFiltered: boolean;
  handleResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

// Sort option labels for display
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: SortOptionEnum.AddedNewest, label: 'Date Added (Newest)' },
  { value: SortOptionEnum.AddedOldest, label: 'Date Added (Oldest)' },
  { value: SortOptionEnum.ArtistAZ, label: 'Artist A-Z' },
  { value: SortOptionEnum.ArtistZA, label: 'Artist Z-A' },
  { value: SortOptionEnum.AlbumAZ, label: 'Album A-Z' },
  { value: SortOptionEnum.AlbumZA, label: 'Album Z-A' },
  { value: SortOptionEnum.YearNewest, label: 'Year (Newest)' },
  { value: SortOptionEnum.YearOldest, label: 'Year (Oldest)' },
  { value: SortOptionEnum.FormatAZ, label: 'Format A-Z' },
  { value: SortOptionEnum.FormatZA, label: 'Format Z-A' },
  { value: SortOptionEnum.LabelAZ, label: 'Label A-Z' },
  { value: SortOptionEnum.LabelZA, label: 'Label Z-A' },
  { value: SortOptionEnum.CatNoAZ, label: 'Catalog# A-Z' },
  { value: SortOptionEnum.CatNoZA, label: 'Catalog# Z-A' },
];

type PickerModalType = 'sort' | 'format' | 'year' | null;

interface PickerOption {
  value: string;
  label: string;
}

export const CollectionFilters: React.FC<CollectionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  selectedFormat,
  setSelectedFormat,
  selectedYear,
  setSelectedYear,
  filterOptions,
  isFiltered,
  handleResetFilters,
  totalCount,
  filteredCount,
}) => {
  const [activeModal, setActiveModal] = useState<PickerModalType>(null);

  // Get current sort label
  const currentSortLabel =
    sortOption === SortOptionEnum.SearchRelevance
      ? 'Search Relevance'
      : SORT_OPTIONS.find((opt) => opt.value === sortOption)?.label || 'Sort';

  // Build format options
  const formatOptions: PickerOption[] = [
    { value: '', label: `All Formats (${filterOptions.formats.size})` },
    ...Array.from(filterOptions.formats.entries()).map(([name, count]) => ({
      value: name,
      label: `${name} (${count})`,
    })),
  ];

  // Build year options
  const yearOptions: PickerOption[] = [
    { value: '', label: `All Years (${filterOptions.years.size})` },
    ...Array.from(filterOptions.years.entries()).map(([year, count]) => ({
      value: year.toString(),
      label: `${year} (${count})`,
    })),
  ];

  // Build sort options (include SearchRelevance only when searching)
  const sortOptions: PickerOption[] = [
    ...(searchTerm
      ? [{ value: SortOptionEnum.SearchRelevance, label: 'Search Relevance' }]
      : []),
    ...SORT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
  ];

  const handleSelectSort = (value: string) => {
    setSortOption(value as SortOption);
    setActiveModal(null);
  };

  const handleSelectFormat = (value: string) => {
    setSelectedFormat(value);
    setActiveModal(null);
  };

  const handleSelectYear = (value: string) => {
    setSelectedYear(value);
    setActiveModal(null);
  };

  const renderPickerModal = () => {
    if (!activeModal) return null;

    let title: string;
    let options: PickerOption[];
    let selectedValue: string;
    let onSelect: (value: string) => void;

    switch (activeModal) {
      case 'sort':
        title = 'Sort By';
        options = sortOptions;
        selectedValue = sortOption;
        onSelect = handleSelectSort;
        break;
      case 'format':
        title = 'Filter by Format';
        options = formatOptions;
        selectedValue = selectedFormat;
        onSelect = handleSelectFormat;
        break;
      case 'year':
        title = 'Filter by Year';
        options = yearOptions;
        selectedValue = selectedYear;
        onSelect = handleSelectYear;
        break;
      default:
        return null;
    }

    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={() => setActiveModal(null)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Done</Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.modalOption,
                  item.value === selectedValue && styles.modalOptionSelected,
                ]}
                onPress={() => onSelect(item.value)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    item.value === selectedValue && styles.modalOptionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === selectedValue && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search collection..."
        placeholderTextColor="#6b7280"
        value={searchTerm}
        onChangeText={setSearchTerm}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Filter row */}
      <View style={styles.filterRow}>
        {/* Sort button */}
        <Pressable style={styles.filterButton} onPress={() => setActiveModal('sort')}>
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {currentSortLabel}
          </Text>
          <Text style={styles.filterArrow}>▼</Text>
        </Pressable>

        {/* Format filter */}
        <Pressable style={styles.filterButton} onPress={() => setActiveModal('format')}>
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {selectedFormat || 'Format'}
          </Text>
          <Text style={styles.filterArrow}>▼</Text>
        </Pressable>

        {/* Year filter */}
        <Pressable style={styles.filterButton} onPress={() => setActiveModal('year')}>
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {selectedYear || 'Year'}
          </Text>
          <Text style={styles.filterArrow}>▼</Text>
        </Pressable>
      </View>

      {/* Status row */}
      <View style={styles.statusRow}>
        {isFiltered && (
          <Pressable style={styles.resetButton} onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>
        )}
        <Text style={styles.countText}>
          {isFiltered
            ? `${filteredCount} / ${totalCount} albums`
            : `${totalCount} albums`}
        </Text>
      </View>

      {renderPickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(18, 18, 18, 0.95)', // gray-900 with opacity
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    backgroundColor: '#181818', // gray-800
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#282828', // gray-700
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181818', // gray-800
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#282828', // gray-700
  },
  filterButtonText: {
    color: '#e0e0e0', // gray-300
    fontSize: 13,
    flex: 1,
  },
  filterArrow: {
    color: '#535353', // gray-500
    fontSize: 10,
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resetButton: {
    backgroundColor: '#282828', // gray-700
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  countText: {
    color: '#b3b3b3', // gray-400
    fontSize: 13,
    marginLeft: 'auto',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212', // gray-900
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282828', // gray-700
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#3b82f6', // blue-500
    fontSize: 16,
    fontWeight: '600',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#282828', // gray-700
  },
  modalOptionSelected: {
    backgroundColor: '#181818', // gray-800
  },
  modalOptionText: {
    color: '#e0e0e0', // gray-300
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: '#3b82f6', // blue-500
    fontWeight: '600',
  },
  checkmark: {
    color: '#3b82f6', // blue-500
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CollectionFilters;
