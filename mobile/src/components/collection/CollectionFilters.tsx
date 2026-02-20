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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SortOption, FilterOptions } from '@libs';
import { SortOption as SortOptionEnum, colors, filterStyles, pickerModalStyles } from '@libs';

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
  numColumns: number;
  setNumColumns: (value: number) => void;
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

type PickerModalType = 'sort' | 'format' | 'year' | 'columns' | null;

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
  numColumns,
  setNumColumns,
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

  const handleSelectColumns = (value: string) => {
    setNumColumns(parseInt(value, 10));
    setActiveModal(null);
  };

  // Column options
  const columnOptions: PickerOption[] = [
    { value: '2', label: '2 per row' },
    { value: '3', label: '3 per row' },
    { value: '4', label: '4 per row' },
  ];

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
      case 'columns':
        title = 'Albums per Row';
        options = columnOptions;
        selectedValue = numColumns.toString();
        onSelect = handleSelectColumns;
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
      {/* Row 1: Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search collection..."
        placeholderTextColor={colors.gray[500]}
        value={searchTerm}
        onChangeText={setSearchTerm}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Row 2: Sort + Format + Year filters */}
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

      {/* Row 3: Columns selector + Reset */}
      <View style={styles.statusRow}>
        {/* Columns selector */}
        <Pressable style={styles.columnsButton} onPress={() => setActiveModal('columns')}>
          <Text style={styles.columnsButtonText}>{numColumns}</Text>
          <Text style={styles.filterArrow}>▼</Text>
        </Pressable>

        {isFiltered && (
          <Pressable style={styles.resetButton} onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>
        )}
      </View>

      {renderPickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: filterStyles.container,
  searchInput: filterStyles.searchInput,
  filterRow: filterStyles.filterRow,
  filterButton: filterStyles.filterButton,
  filterButtonText: filterStyles.filterButtonText,
  filterArrow: filterStyles.filterArrow,
  statusRow: filterStyles.statusRow,
  columnsButton: filterStyles.columnsButton,
  columnsButtonText: filterStyles.columnsButtonText,
  resetButton: filterStyles.resetButton,
  resetButtonText: filterStyles.resetButtonText,
  // Modal styles
  modalContainer: pickerModalStyles.container,
  modalHeader: pickerModalStyles.header,
  modalTitle: pickerModalStyles.title,
  modalCloseButton: pickerModalStyles.closeButton,
  modalCloseText: pickerModalStyles.closeText,
  modalOption: pickerModalStyles.option,
  modalOptionSelected: pickerModalStyles.optionSelected,
  modalOptionText: pickerModalStyles.optionText,
  modalOptionTextSelected: pickerModalStyles.optionTextSelected,
  checkmark: pickerModalStyles.checkmark,
});

export default CollectionFilters;
