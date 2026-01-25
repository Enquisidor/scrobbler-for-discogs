import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Hook to track which items are currently visible on screen.
 * Used by FlatList/scroll views to report visible items for priority metadata fetching.
 */
export function useVisibleItems() {
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const visibleIdsRef = useRef<Set<number>>(new Set());

  // Callback for FlatList's onViewableItemsChanged
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: { id: number } }> }) => {
      const newVisibleIds = new Set<number>();
      viewableItems.forEach(({ item }) => {
        if (item?.id !== undefined) {
          newVisibleIds.add(item.id);
        }
      });

      // Only update if the set actually changed
      const currentIds = visibleIdsRef.current;
      const hasChanged =
        newVisibleIds.size !== currentIds.size ||
        [...newVisibleIds].some(id => !currentIds.has(id));

      if (hasChanged) {
        visibleIdsRef.current = newVisibleIds;
        setVisibleIds(newVisibleIds);
      }
    },
    []
  );

  // Memoized config for FlatList
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50, // Item is "visible" if 50% is on screen
      minimumViewTime: 100, // Must be visible for 100ms to count
    }),
    []
  );

  return {
    visibleIds,
    onViewableItemsChanged,
    viewabilityConfig,
  };
}
