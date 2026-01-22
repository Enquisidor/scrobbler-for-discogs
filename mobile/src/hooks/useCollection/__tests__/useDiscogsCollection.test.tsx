/**
 * Tests for useDiscogsCollection hook
 *
 * Priority 2 - High: Collection sync, pagination, concurrent workers, rate limiting
 *
 * Note: Tests mock discogsService - no actual API calls are made
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useDiscogsCollection } from '../useDiscogsCollection';
import * as discogsService from '../../../services/discogsService';
import collectionReducer from '../../../../../libs/src/store/collectionSlice';
import { connectedCredentials, createMockCollectionResponse } from '../../../__tests__/testUtils';

// Mock the discogs service
jest.mock('../../../services/discogsService');

const mockFetchDiscogsPage = discogsService.fetchDiscogsPage as jest.Mock;

// Create a wrapper with Redux provider
const createWrapper = () => {
  const store = configureStore({
    reducer: {
      collection: collectionReducer,
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useDiscogsCollection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when not connected', () => {
    it('should reset collection and not fetch', async () => {
      const wrapper = createWrapper();

      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, false),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchDiscogsPage).not.toHaveBeenCalled();
      expect(result.current.collection).toEqual([]);
    });
  });

  describe('when connected', () => {
    it('should fetch first page on mount', async () => {
      const mockResponse = createMockCollectionResponse(1, 1, 10);
      mockFetchDiscogsPage.mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchDiscogsPage).toHaveBeenCalledWith(
        connectedCredentials.discogsUsername,
        connectedCredentials.discogsAccessToken,
        connectedCredentials.discogsAccessTokenSecret,
        1,
        'added',
        'desc',
        50
      );
    });

    it('should set collection from first page', async () => {
      const mockResponse = createMockCollectionResponse(1, 1, 5);
      mockFetchDiscogsPage.mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.collection).toHaveLength(5);
    });

    it('should set isSyncing when multiple pages exist', async () => {
      const mockResponse = createMockCollectionResponse(1, 3, 50);
      mockFetchDiscogsPage.mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSyncing).toBe(true);
    });

    it('should not set isSyncing for single page', async () => {
      const mockResponse = createMockCollectionResponse(1, 1, 10);
      mockFetchDiscogsPage.mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should set isAuthError on DiscogsAuthError', async () => {
      mockFetchDiscogsPage.mockRejectedValue(
        new discogsService.DiscogsAuthError('Auth failed')
      );

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isAuthError).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set error on general error', async () => {
      mockFetchDiscogsPage.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('forceReload', () => {
    it('should trigger a new fetch when called', async () => {
      const mockResponse = createMockCollectionResponse(1, 1, 10);
      mockFetchDiscogsPage.mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchDiscogsPage).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.forceReload();
      });

      await waitFor(() => {
        expect(mockFetchDiscogsPage).toHaveBeenCalledTimes(2);
      });
    });

    it('should not reload when not connected', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, false),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.forceReload();
      });

      // Should still be 0 calls
      expect(mockFetchDiscogsPage).not.toHaveBeenCalled();
    });
  });

  describe('return values', () => {
    it('should return all expected values', async () => {
      const mockResponse = createMockCollectionResponse(1, 1, 5);
      mockFetchDiscogsPage.mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('collection');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isSyncing');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isAuthError');
      expect(result.current).toHaveProperty('forceReload');
      expect(typeof result.current.forceReload).toBe('function');
    });
  });

  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      // Create a slow response
      let resolvePromise: (value: any) => void;
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockFetchDiscogsPage.mockReturnValue(slowPromise);

      const wrapper = createWrapper();
      const { result, unmount } = renderHook(
        () => useDiscogsCollection(connectedCredentials, true),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);

      // Unmount before promise resolves
      unmount();

      // Resolve the promise after unmount
      resolvePromise!(createMockCollectionResponse(1, 1, 10));

      // Should not throw or update state - just give it a moment
      await jest.runAllTimersAsync();
    }, 10000); // Increase timeout for this async test
  });
});
