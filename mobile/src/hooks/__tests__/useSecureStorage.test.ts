/**
 * Tests for useSecureStorage hook
 *
 * Covers: Credential storage in SecureStore (TESTING.md #1)
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { useSecureStorage } from '../useSecureStorage';

// Cast mocks for TypeScript
const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

describe('useSecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should return initial value when storage is empty', async () => {
      mockGetItemAsync.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { name: 'default' })
      );

      // Initially loading
      expect(result.current[2].isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual({ name: 'default' });
      expect(mockGetItemAsync).toHaveBeenCalledWith('test-key');
    });

    it('should load stored value from SecureStore', async () => {
      const storedData = { name: 'stored', count: 42 };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedData));

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { name: 'default', count: 0 })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual(storedData);
    });

    it('should handle malformed JSON in storage', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetItemAsync.mockResolvedValue('not valid json');

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      // Should fall back to initial value
      expect(result.current[0]).toEqual({ name: 'default' });
      consoleSpy.mockRestore();
    });
  });

  describe('Save Value', () => {
    it('should save value to SecureStore', async () => {
      mockGetItemAsync.mockResolvedValue(null);
      mockSetItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      const setValue = result.current[1];
      await act(async () => {
        await setValue({ name: 'updated' });
      });

      expect(mockSetItemAsync).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ name: 'updated' })
      );
      expect(result.current[0]).toEqual({ name: 'updated' });
    });

    it('should support functional updates', async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify({ count: 5 }));
      mockSetItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { count: 0 })
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

    it('should handle complex nested objects', async () => {
      mockGetItemAsync.mockResolvedValue(null);
      mockSetItemAsync.mockResolvedValue(undefined);

      const complexData = {
        user: { name: 'test', id: 123 },
        tokens: { access: 'abc', refresh: 'xyz' },
        settings: { darkMode: true },
      };

      const { result } = renderHook(() =>
        useSecureStorage('credentials', {})
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      await act(async () => {
        await result.current[1](complexData);
      });

      expect(mockSetItemAsync).toHaveBeenCalledWith(
        'credentials',
        JSON.stringify(complexData)
      );
    });
  });

  describe('Remove Value', () => {
    it('should remove value from SecureStore', async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify({ name: 'stored' }));
      mockDeleteItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      const { removeValue } = result.current[2];
      await act(async () => {
        await removeValue();
      });

      expect(mockDeleteItemAsync).toHaveBeenCalledWith('test-key');
      expect(result.current[0]).toEqual({ name: 'default' });
    });
  });

  describe('Error Handling', () => {
    it('should handle SecureStore read errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetItemAsync.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { name: 'default' })
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
      mockGetItemAsync.mockResolvedValue(null);
      mockSetItemAsync.mockRejectedValue(new Error('Save failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { name: 'default' })
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
      mockGetItemAsync.mockResolvedValue(JSON.stringify({ name: 'stored' }));
      mockDeleteItemAsync.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useSecureStorage('test-key', { name: 'default' })
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
      mockGetItemAsync
        .mockResolvedValueOnce(JSON.stringify({ key: 'first' }))
        .mockResolvedValueOnce(JSON.stringify({ key: 'second' }));

      const { result, rerender } = renderHook(
        ({ storageKey }: { storageKey: string }) => useSecureStorage(storageKey, { key: 'default' }),
        { initialProps: { storageKey: 'key1' } }
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual({ key: 'first' });

      rerender({ storageKey: 'key2' });

      await waitFor(() => {
        expect(mockGetItemAsync).toHaveBeenCalledWith('key2');
      });
    });
  });
});
