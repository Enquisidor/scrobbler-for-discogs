/**
 * Tests for useVisibleItems hook
 */
import { renderHook, act } from '@testing-library/react-native';
import { useVisibleItems } from '../useVisibleItems';

describe('useVisibleItems', () => {
  describe('Initial State', () => {
    it('should return empty visibleIds set initially', () => {
      const { result } = renderHook(() => useVisibleItems());

      expect(result.current.visibleIds).toBeInstanceOf(Set);
      expect(result.current.visibleIds.size).toBe(0);
    });

    it('should return onViewableItemsChanged callback', () => {
      const { result } = renderHook(() => useVisibleItems());

      expect(typeof result.current.onViewableItemsChanged).toBe('function');
    });

    it('should return viewabilityConfig object', () => {
      const { result } = renderHook(() => useVisibleItems());

      expect(result.current.viewabilityConfig).toEqual({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100,
      });
    });
  });

  describe('onViewableItemsChanged', () => {
    it('should update visibleIds when items become visible', () => {
      const { result } = renderHook(() => useVisibleItems());

      act(() => {
        result.current.onViewableItemsChanged({
          viewableItems: [
            { item: { id: 1 } },
            { item: { id: 2 } },
            { item: { id: 3 } },
          ],
        });
      });

      expect(result.current.visibleIds.size).toBe(3);
      expect(result.current.visibleIds.has(1)).toBe(true);
      expect(result.current.visibleIds.has(2)).toBe(true);
      expect(result.current.visibleIds.has(3)).toBe(true);
    });

    it('should remove items that are no longer visible', () => {
      const { result } = renderHook(() => useVisibleItems());

      // Initial visible items
      act(() => {
        result.current.onViewableItemsChanged({
          viewableItems: [
            { item: { id: 1 } },
            { item: { id: 2 } },
            { item: { id: 3 } },
          ],
        });
      });

      expect(result.current.visibleIds.size).toBe(3);

      // Item 1 scrolls out of view
      act(() => {
        result.current.onViewableItemsChanged({
          viewableItems: [
            { item: { id: 2 } },
            { item: { id: 3 } },
            { item: { id: 4 } },
          ],
        });
      });

      expect(result.current.visibleIds.size).toBe(3);
      expect(result.current.visibleIds.has(1)).toBe(false);
      expect(result.current.visibleIds.has(2)).toBe(true);
      expect(result.current.visibleIds.has(3)).toBe(true);
      expect(result.current.visibleIds.has(4)).toBe(true);
    });

    it('should handle empty viewableItems', () => {
      const { result } = renderHook(() => useVisibleItems());

      // Add some items first
      act(() => {
        result.current.onViewableItemsChanged({
          viewableItems: [{ item: { id: 1 } }],
        });
      });

      expect(result.current.visibleIds.size).toBe(1);

      // Clear all
      act(() => {
        result.current.onViewableItemsChanged({
          viewableItems: [],
        });
      });

      expect(result.current.visibleIds.size).toBe(0);
    });

    it('should ignore items with undefined id', () => {
      const { result } = renderHook(() => useVisibleItems());

      act(() => {
        result.current.onViewableItemsChanged({
          viewableItems: [
            { item: { id: 1 } },
            { item: { id: undefined } } as any,
            { item: {} } as any,
            { item: { id: 3 } },
          ],
        });
      });

      expect(result.current.visibleIds.size).toBe(2);
      expect(result.current.visibleIds.has(1)).toBe(true);
      expect(result.current.visibleIds.has(3)).toBe(true);
    });

    it('should not update state if visible items have not changed', () => {
      const { result } = renderHook(() => useVisibleItems());

      act(() => {
        result.current.onViewableItemsChanged({
          viewableItems: [
            { item: { id: 1 } },
            { item: { id: 2 } },
          ],
        });
      });

      const firstSet = result.current.visibleIds;

      // Same items, different order
      act(() => {
        result.current.onViewableItemsChanged({
          viewableItems: [
            { item: { id: 2 } },
            { item: { id: 1 } },
          ],
        });
      });

      // Should be the same reference (no state update)
      expect(result.current.visibleIds).toBe(firstSet);
    });
  });

  describe('viewabilityConfig', () => {
    it('should have stable reference across renders', () => {
      const { result, rerender } = renderHook(() => useVisibleItems());

      const firstConfig = result.current.viewabilityConfig;

      rerender({});

      expect(result.current.viewabilityConfig).toBe(firstConfig);
    });
  });
});
