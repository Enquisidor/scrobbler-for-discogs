/**
 * Tests for useAsyncStorage hook
 *
 * Covers: Various data types, error handling, race conditions (Plan Phase 2.5)
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAsyncStorage } from '../useAsyncStorage';

// Cast mocks for TypeScript
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

describe('useAsyncStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should return initial value when storage is empty', async () => {
      mockGetItem.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { name: 'default' })
      );

      expect(result.current[2].isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual({ name: 'default' });
      expect(mockGetItem).toHaveBeenCalledWith('test-key');
    });

    it('should load stored value from AsyncStorage', async () => {
      const storedData = { name: 'stored', count: 42 };
      mockGetItem.mockResolvedValue(JSON.stringify(storedData));

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { name: 'default', count: 0 })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual(storedData);
    });

    it('should handle malformed JSON in storage', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetItem.mockResolvedValue('not valid json');

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      // Should fall back to initial value
      expect(result.current[0]).toEqual({ name: 'default' });
      consoleSpy.mockRestore();
    });
  });

  describe('Various Data Types', () => {
    it('should handle string values', async () => {
      mockGetItem.mockResolvedValue(JSON.stringify('stored string'));
      mockSetItem.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncStorage('string-key', 'default')
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toBe('stored string');

      await act(async () => {
        await result.current[1]('new string');
      });

      expect(result.current[0]).toBe('new string');
    });

    it('should handle number values', async () => {
      mockGetItem.mockResolvedValue(JSON.stringify(42));
      mockSetItem.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncStorage('number-key', 0)
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toBe(42);
    });

    it('should handle boolean values', async () => {
      mockGetItem.mockResolvedValue(JSON.stringify(true));
      mockSetItem.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncStorage('boolean-key', false)
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toBe(true);
    });

    it('should handle array values', async () => {
      const storedArray = [1, 2, 3, { nested: true }];
      mockGetItem.mockResolvedValue(JSON.stringify(storedArray));
      mockSetItem.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncStorage<(number | { nested: boolean })[]>('array-key', [])
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual(storedArray);
    });

    it('should handle nested object values', async () => {
      const nestedObject = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
        array: [1, 2, 3],
      };
      mockGetItem.mockResolvedValue(JSON.stringify(nestedObject));

      const { result } = renderHook(() =>
        useAsyncStorage('nested-key', {})
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual(nestedObject);
    });
  });

  describe('Save Value', () => {
    it('should save value to AsyncStorage', async () => {
      mockGetItem.mockResolvedValue(null);
      mockSetItem.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      const setValue = result.current[1];
      await act(async () => {
        await setValue({ name: 'updated' });
      });

      expect(mockSetItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ name: 'updated' })
      );
      expect(result.current[0]).toEqual({ name: 'updated' });
    });

    it('should support functional updates', async () => {
      mockGetItem.mockResolvedValue(JSON.stringify({ count: 5 }));
      mockSetItem.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { count: 0 })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      const setValue = result.current[1];
      await act(async () => {
        await setValue((prev: { count: number }) => ({ count: prev.count + 1 }));
      });

      expect(result.current[0]).toEqual({ count: 6 });
    });
  });

  describe('Remove Value', () => {
    it('should remove value from AsyncStorage', async () => {
      mockGetItem.mockResolvedValue(JSON.stringify({ name: 'stored' }));
      mockRemoveItem.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      const { removeValue } = result.current[2];
      await act(async () => {
        await removeValue();
      });

      expect(mockRemoveItem).toHaveBeenCalledWith('test-key');
      expect(result.current[0]).toEqual({ name: 'default' });
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage read errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      // Should return initial value on error
      expect(result.current[0]).toEqual({ name: 'default' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should throw error on save failure', async () => {
      mockGetItem.mockResolvedValue(null);
      mockSetItem.mockRejectedValue(new Error('Save failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      const setValue = result.current[1];
      await expect(
        act(async () => {
          await setValue({ name: 'new' });
        })
      ).rejects.toThrow('Save failed');

      consoleSpy.mockRestore();
    });

    it('should throw error on delete failure', async () => {
      mockGetItem.mockResolvedValue(JSON.stringify({ name: 'stored' }));
      mockRemoveItem.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useAsyncStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current[2].removeValue();
        })
      ).rejects.toThrow('Delete failed');

      consoleSpy.mockRestore();
    });
  });

  describe('Key Changes', () => {
    it('should reload when key changes', async () => {
      mockGetItem
        .mockResolvedValueOnce(JSON.stringify({ key: 'first' }))
        .mockResolvedValueOnce(JSON.stringify({ key: 'second' }));

      const { result, rerender } = renderHook(
        ({ storageKey }: { storageKey: string }) => useAsyncStorage(storageKey, { key: 'default' }),
        { initialProps: { storageKey: 'key1' } }
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual({ key: 'first' });

      rerender({ storageKey: 'key2' });

      await waitFor(() => {
        expect(mockGetItem).toHaveBeenCalledWith('key2');
      });
    });
  });
});
