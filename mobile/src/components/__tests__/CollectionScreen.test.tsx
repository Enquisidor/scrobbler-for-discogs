/**
 * Tests for CollectionScreen component
 *
 * Covers: Test with 1000+ albums, verify scrolling performance, test pull-to-refresh (Plan Phase 4.2)
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CollectionScreen } from '../collection/CollectionScreen';
import type { DiscogsRelease, Settings, QueueItem } from '../../libs';

// Mock the libs functions with STRINGS included
jest.mock('scrobbler-for-discogs-libs', () => ({
  getReleaseDisplayArtist: jest.fn(() => 'Test Artist'),
  getReleaseDisplayTitle: jest.fn(() => 'Test Album'),
  STRINGS: {
    APP_NAME: 'Vinyl Scrobbler',
    BUTTONS: {
      DISCOGS: 'Discogs',
      LASTFM: 'Last.fm',
      CONNECT_DISCOGS: 'Connect Discogs',
      CONNECT_LASTFM: 'Connect Last.fm',
      QUEUE: 'Queue',
      DONE: 'Done',
      CLEAR: 'Clear',
      SCROBBLE_ALL: 'Scrobble All',
      REMOVE_FROM_QUEUE: 'Remove from Queue',
    },
    HEADERS: {
      VIEW_COLLECTION: 'View Your Collection',
      SETTINGS: 'Settings',
      QUEUE: 'Queue',
      HISTORY: 'History',
      READY_TO_SCROBBLE: 'Ready to Scrobble',
      RECENTLY_SCROBBLED: 'Recently Scrobbled',
    },
    ERRORS: {
      FAILED_TO_LOAD_ALBUM: 'Failed to load album details.',
    },
    EMPTY_STATES: {
      NO_FILTERED_ALBUMS: 'No albums match your filters.',
      EMPTY_COLLECTION: 'Your collection appears to be empty.',
      EMPTY_QUEUE: 'Your queue is empty',
      QUEUE_INSTRUCTIONS: 'Tap albums in your collection to add them to the queue for scrobbling.',
    },
    STATUS: {
      LOADING_COLLECTION: 'Loading your collection...',
      CONNECT_COLLECTION_INFO: 'To get started, connect your Discogs account. This will allow this scrobbler to load and display your record collection.',
    },
    BADGES: {
      ERROR: 'Error',
      NO_IMAGE: 'No Image',
    },
  },
}));

// Helper to generate mock releases
const generateMockReleases = (count: number): DiscogsRelease[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    instance_id: i + 1000,
    date_added: '2024-01-01',
    basic_information: {
      title: `Album ${i + 1}`,
      year: 2020 + (i % 5),
      thumb: `https://example.com/thumb${i + 1}.jpg`,
      cover_image: `https://example.com/cover${i + 1}.jpg`,
      formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP'] }],
      labels: [{ name: 'Test Label', catno: `TL${i + 1}`, id: 1 }],
      artists: [{ name: `Artist ${i + 1}`, id: 1 }],
      artist_display_name: `Artist ${i + 1}`,
    },
  }));
};

const mockSettings: Settings = {
  selectAllTracksPerRelease: true,
  selectSubtracksByDefault: true,
  showFeatures: true,
  selectFeaturesByDefault: false,
  artistSource: 'discogs',
  albumSource: 'discogs',
};

describe('CollectionScreen', () => {
  const defaultProps = {
    collection: generateMockReleases(10),
    queue: [] as QueueItem[],
    isLoading: false,
    isSyncing: false,
    hasMore: false,
    onLoadMore: jest.fn(),
    onRefresh: jest.fn(),
    isFiltered: false,
    onAddAlbumToQueue: jest.fn(),
    onRemoveLastInstanceOfAlbumFromQueue: jest.fn(),
    onRemoveAllInstancesOfAlbumFromQueue: jest.fn(),
    onConnectDiscogs: jest.fn(),
    isConnectingDiscogs: false,
    settings: mockSettings,
    metadata: {},
    testID: 'collection-screen',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Not Connected State', () => {
    it('should show connect button when collection is empty and not loading', () => {
      const { getByTestId, getByText } = render(
        <CollectionScreen {...defaultProps} collection={[]} />
      );

      expect(getByText('View Your Collection')).toBeTruthy();
      expect(getByText('Connect Discogs')).toBeTruthy();
      expect(getByTestId('collection-screen-connect-button')).toBeTruthy();
    });

    it('should call onConnectDiscogs when connect button is pressed', () => {
      const onConnectDiscogs = jest.fn();
      const { getByTestId } = render(
        <CollectionScreen
          {...defaultProps}
          collection={[]}
          onConnectDiscogs={onConnectDiscogs}
        />
      );

      fireEvent.press(getByTestId('collection-screen-connect-button'));

      expect(onConnectDiscogs).toHaveBeenCalledTimes(1);
    });

    it('should show loading indicator when connecting', () => {
      const { getByTestId } = render(
        <CollectionScreen
          {...defaultProps}
          collection={[]}
          isConnectingDiscogs={true}
        />
      );

      // Button should be disabled and show activity indicator
      const button = getByTestId('collection-screen-connect-button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading and collection is empty', () => {
      const { getByText } = render(
        <CollectionScreen {...defaultProps} collection={[]} isLoading={true} />
      );

      expect(getByText('Loading your collection...')).toBeTruthy();
    });
  });

  describe('Collection Display', () => {
    it('should render album cards for collection', () => {
      const collection = generateMockReleases(5);
      const { getByTestId } = render(
        <CollectionScreen {...defaultProps} collection={collection} />
      );

      expect(getByTestId('collection-screen')).toBeTruthy();
      // Check first album is rendered
      expect(getByTestId('collection-screen-album-1')).toBeTruthy();
    });

    it('should show empty message when collection is empty after loading', () => {
      const { getByText } = render(
        <CollectionScreen
          {...defaultProps}
          collection={[]}
          isLoading={false}
          isSyncing={true} // Has connected before
        />
      );

      expect(getByText('Your collection appears to be empty.')).toBeTruthy();
    });

    it('should show filtered message when no albums match filters', () => {
      const { getByText } = render(
        <CollectionScreen
          {...defaultProps}
          collection={[]}
          isLoading={false}
          isSyncing={true}
          isFiltered={true}
        />
      );

      expect(getByText('No albums match your filters.')).toBeTruthy();
    });
  });

  describe('Queue Interactions', () => {
    it('should call onAddAlbumToQueue when album card is pressed', () => {
      const onAddAlbumToQueue = jest.fn();
      const collection = generateMockReleases(3);
      const { getByTestId } = render(
        <CollectionScreen
          {...defaultProps}
          collection={collection}
          onAddAlbumToQueue={onAddAlbumToQueue}
        />
      );

      fireEvent.press(getByTestId('collection-screen-album-1'));

      expect(onAddAlbumToQueue).toHaveBeenCalledTimes(1);
      expect(onAddAlbumToQueue).toHaveBeenCalledWith(collection[0]);
    });

    it('should show correct scrobble count on album cards', () => {
      const collection = generateMockReleases(3);
      // QueueItem extends DiscogsRelease with additional queue-specific fields
      const queue: QueueItem[] = [
        { ...collection[0], tracklist: [], instanceKey: '1-1000', isLoading: false, useTrackArtist: false } as QueueItem,
        { ...collection[0], tracklist: [], instanceKey: '1-1001', isLoading: false, useTrackArtist: false } as QueueItem, // Same album twice
      ];

      const { getByTestId, getByText } = render(
        <CollectionScreen
          {...defaultProps}
          collection={collection}
          queue={queue}
        />
      );

      // Album 1 should show badge with count 2
      expect(getByTestId('collection-screen-album-1-badge')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('should call onRefresh when pulled to refresh', () => {
      const onRefresh = jest.fn();
      const { getByTestId } = render(
        <CollectionScreen {...defaultProps} onRefresh={onRefresh} />
      );

      const flatList = getByTestId('collection-screen');

      // Simulate pull to refresh
      fireEvent(flatList, 'refresh');

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should show refresh indicator when syncing', () => {
      const { getByTestId } = render(
        <CollectionScreen {...defaultProps} isSyncing={true} />
      );

      // The FlatList should have refreshing prop set to true
      const flatList = getByTestId('collection-screen');
      expect(flatList.props.refreshControl.props.refreshing).toBe(true);
    });
  });

  describe('Infinite Scroll / Load More', () => {
    it('should call onLoadMore when reaching end of list', () => {
      const onLoadMore = jest.fn();
      const { getByTestId } = render(
        <CollectionScreen
          {...defaultProps}
          hasMore={true}
          onLoadMore={onLoadMore}
        />
      );

      const flatList = getByTestId('collection-screen');

      // Simulate reaching end of list
      fireEvent(flatList, 'endReached');

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should not call onLoadMore when there is no more data', () => {
      const onLoadMore = jest.fn();
      const { getByTestId } = render(
        <CollectionScreen
          {...defaultProps}
          hasMore={false}
          onLoadMore={onLoadMore}
        />
      );

      const flatList = getByTestId('collection-screen');

      fireEvent(flatList, 'endReached');

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('should not call onLoadMore when already loading', () => {
      const onLoadMore = jest.fn();
      const { getByTestId } = render(
        <CollectionScreen
          {...defaultProps}
          hasMore={true}
          isLoading={true}
          onLoadMore={onLoadMore}
        />
      );

      const flatList = getByTestId('collection-screen');

      fireEvent(flatList, 'endReached');

      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  describe('Performance with Large Collections', () => {
    it('should render 1000+ albums efficiently', () => {
      const largeCollection = generateMockReleases(1000);
      const startTime = Date.now();

      const { getByTestId } = render(
        <CollectionScreen {...defaultProps} collection={largeCollection} />
      );

      const renderTime = Date.now() - startTime;

      // Should render quickly (under 5 seconds)
      expect(renderTime).toBeLessThan(5000);
      expect(getByTestId('collection-screen')).toBeTruthy();
    });

    it('should use performance optimizations', () => {
      const collection = generateMockReleases(100);
      const { getByTestId } = render(
        <CollectionScreen {...defaultProps} collection={collection} />
      );

      const flatList = getByTestId('collection-screen');

      // Verify performance props are set
      expect(flatList.props.removeClippedSubviews).toBe(true);
      expect(flatList.props.maxToRenderPerBatch).toBe(10);
      expect(flatList.props.windowSize).toBe(5);
      expect(flatList.props.initialNumToRender).toBe(12);
    });
  });

  describe('Grid Layout', () => {
    it('should render with default 3 columns', () => {
      const { getByTestId, UNSAFE_getByType } = render(<CollectionScreen {...defaultProps} />);
      const { FlatList } = require('react-native');

      expect(getByTestId('collection-screen')).toBeTruthy();
      const flatList = UNSAFE_getByType(FlatList);
      expect(flatList.props.numColumns).toBe(3);
    });

    it('should support custom number of columns', () => {
      const { UNSAFE_getByType } = render(
        <CollectionScreen {...defaultProps} numColumns={4} />
      );
      const { FlatList } = require('react-native');

      const flatList = UNSAFE_getByType(FlatList);
      expect(flatList.props.numColumns).toBe(4);
    });
  });
});
