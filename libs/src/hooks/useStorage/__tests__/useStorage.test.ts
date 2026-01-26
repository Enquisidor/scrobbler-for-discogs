/**
 * Tests for useStorage hook
 *
 * Covers: Storage abstraction with secure option (TESTING.md #1)
 */

// Mock storage modules before any imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useStorage } from '../useStorage';

// Cast mocks for TypeScript
const mockAsyncGetItem = AsyncStorage.getItem as jest.Mock;
const mockAsyncSetItem = AsyncStorage.setItem as jest.Mock;
const mockAsyncRemoveItem = AsyncStorage.removeItem as jest.Mock;
const mockSecureGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSecureSetItem = SecureStore.setItemAsync as jest.Mock;
const mockSecureDeleteItem = SecureStore.deleteItemAsync as jest.Mock;

describe('useStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AsyncStorage (default)', () => {
    describe('Initial Load', () => {
      it('should return initial value when storage is empty', async () => {
        mockAsyncGetItem.mockResolvedValue(null);

        const { result } = renderHook(() =>
          useStorage('test-key', { name: 'default' })
        );

        expect(result.current[2].isLoading).toBe(true);

        await waitFor(() => {
          expect(result.current[2].isLoading).toBe(false);
        });

        expect(result.current[0]).toEqual({ name: 'default' });
        expect(mockAsyncGetItem).toHaveBeenCalledWith('test-key');
      });

      it('should load stored value from AsyncStorage', async () => {
        const storedData = { name: 'stored', count: 42 };
        mockAsyncGetItem.mockResolvedValue(JSON.stringify(storedData));

        const { result } = renderHook(() =>
          useStorage('test-key', { name: 'default', count: 0 })
        );

        await waitFor(() => {
          expect(result.current[2].isLoading).toBe(false);
        });

        expect(result.current[0]).toEqual(storedData);
      });
    });

    describe('Save Value', () => {
      it('should save value to AsyncStorage', async () => {
        mockAsyncGetItem.mockResolvedValue(null);
        mockAsyncSetItem.mockResolvedValue(undefined);

        const { result } = renderHook(() =>
          useStorage('test-key', { name: 'default' })
        );

        await waitFor(() => {
          expect(result.current[2].isLoading).toBe(false);
        });

        const setValue = result.current[1];
        await act(async () => {
          await setValue({ name: 'updated' });
        });

        expect(mockAsyncSetItem).toHaveBeenCalledWith(
          'test-key',
          JSON.stringify({ name: 'updated' })
        );
        expect(result.current[0]).toEqual({ name: 'updated' });
      });

      it('should support functional updates', async () => {
        mockAsyncGetItem.mockResolvedValue(JSON.stringify({ count: 5 }));
        mockAsyncSetItem.mockResolvedValue(undefined);

        const { result } = renderHook(() =>
          useStorage('test-key', { count: 0 })
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
        mockAsyncGetItem.mockResolvedValue(JSON.stringify({ name: 'stored' }));
        mockAsyncRemoveItem.mockResolvedValue(undefined);

        const { result } = renderHook(() =>
          useStorage('test-key', { name: 'default' })
        );

        await waitFor(() => {
          expect(result.current[2].isLoading).toBe(false);
        });

        const { removeValue } = result.current[2];
        await act(async () => {
          await removeValue();
        });

        expect(mockAsyncRemoveItem).toHaveBeenCalledWith('test-key');
        expect(result.current[0]).toEqual({ name: 'default' });
      });
    });
  });

  describe('SecureStore (secure: true)', () => {
    describe('Initial Load', () => {
      it('should return initial value when secure storage is empty', async () => {
        mockSecureGetItem.mockResolvedValue(null);

        const { result } = renderHook(() =>
          useStorage('credentials', { token: '' }, { secure: true })
        );

        expect(result.current[2].isLoading).toBe(true);

        await waitFor(() => {
          expect(result.current[2].isLoading).toBe(false);
        });

        expect(result.current[0]).toEqual({ token: '' });
        expect(mockSecureGetItem).toHaveBeenCalledWith('credentials');
        expect(mockAsyncGetItem).not.toHaveBeenCalled();
      });

      it('should load stored value from SecureStore', async () => {
        const storedData = { token: 'secret123', refreshToken: 'refresh456' };
        mockSecureGetItem.mockResolvedValue(JSON.stringify(storedData));

        const { result } = renderHook(() =>
          useStorage('credentials', { token: '', refreshToken: '' }, { secure: true })
        );

        await waitFor(() => {
          expect(result.current[2].isLoading).toBe(false);
        });

        expect(result.current[0]).toEqual(storedData);
      });
    });

    describe('Save Value', () => {
      it('should save value to SecureStore', async () => {
        mockSecureGetItem.mockResolvedValue(null);
        mockSecureSetItem.mockResolvedValue(undefined);

        const { result } = renderHook(() =>
          useStorage('credentials', { token: '' }, { secure: true })
        );

        await waitFor(() => {
          expect(result.current[2].isLoading).toBe(false);
        });

        const setValue = result.current[1];
        await act(async () => {
          await setValue({ token: 'newtoken' });
        });

        expect(mockSecureSetItem).toHaveBeenCalledWith(
          'credentials',
          JSON.stringify({ token: 'newtoken' })
        );
        expect(mockAsyncSetItem).not.toHaveBeenCalled();
      });
    });

    describe('Remove Value', () => {
      it('should remove value from SecureStore', async () => {
        mockSecureGetItem.mockResolvedValue(JSON.stringify({ token: 'secret' }));
        mockSecureDeleteItem.mockResolvedValue(undefined);

        const { result } = renderHook(() =>
          useStorage('credentials', { token: '' }, { secure: true })
        );

        await waitFor(() => {
          expect(result.current[2].isLoading).toBe(false);
        });

        const { removeValue } = result.current[2];
        await act(async () => {
          await removeValue();
        });

        expect(mockSecureDeleteItem).toHaveBeenCalledWith('credentials');
        expect(mockAsyncRemoveItem).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage read errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAsyncGetItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() =>
        useStorage('test-key', { name: 'default' })
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual({ name: 'default' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should throw error on save failure', async () => {
      mockAsyncGetItem.mockResolvedValue(null);
      mockAsyncSetItem.mockRejectedValue(new Error('Save failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useStorage('test-key', { name: 'default' })
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
  });

  describe('Key Changes', () => {
    it('should reload when key changes', async () => {
      mockAsyncGetItem
        .mockResolvedValueOnce(JSON.stringify({ key: 'first' }))
        .mockResolvedValueOnce(JSON.stringify({ key: 'second' }));

      const { result, rerender } = renderHook(
        ({ storageKey }: { storageKey: string }) => useStorage(storageKey, { key: 'default' }),
        { initialProps: { storageKey: 'key1' } }
      );

      await waitFor(() => {
        expect(result.current[2].isLoading).toBe(false);
      });

      expect(result.current[0]).toEqual({ key: 'first' });

      rerender({ storageKey: 'key2' });

      await waitFor(() => {
        expect(mockAsyncGetItem).toHaveBeenCalledWith('key2');
      });
    });
  });
});
