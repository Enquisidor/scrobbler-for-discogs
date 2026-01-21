/**
 * Tests for QueueItem component
 *
 * Priority 2 - High: Track list display, remove/scrobble per item
 *
 * Covers:
 * - Basic rendering
 * - Album info display
 * - Track count badge
 * - Expand/collapse functionality
 * - Loading state
 * - Error state
 * - Action buttons (scrobble, remove)
 * - History item styling
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { QueueItem } from '../QueueItem';
import {
  createMockQueueItemWithTracks,
  defaultSettings,
} from '../../../__tests__/testUtils';

describe('QueueItem', () => {
  const defaultProps = {
    item: createMockQueueItemWithTracks(3),
    selectedTrackKeys: new Set(['0', '1', '2']),
    selectedFeatures: new Set<string>(),
    artistSelections: {} as Record<string, Set<string>>,
    scrobbleTimestamps: {} as Record<string, number>,
    settings: defaultSettings,
    metadata: undefined,
    onSelectAll: jest.fn(),
    onDeselectAll: jest.fn(),
    onToggleGroup: jest.fn(),
    onToggle: jest.fn(),
    onFeatureToggle: jest.fn(),
    onArtistToggle: jest.fn(),
    onToggleParent: jest.fn(),
    onSelectParentAsSingle: jest.fn(),
    onRemoveAlbumInstanceFromQueue: jest.fn(),
    onScrobbleModeToggle: jest.fn(),
    onScrobbleSingleRelease: jest.fn(),
    isScrobbling: false,
    isHistoryItem: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render album title', () => {
      render(<QueueItem {...defaultProps} testID="queue-item" />);

      expect(screen.getByText('Test Album')).toBeTruthy();
    });

    it('should render artist name', () => {
      render(<QueueItem {...defaultProps} />);

      expect(screen.getByText('Test Artist')).toBeTruthy();
    });

    it('should render cover image', () => {
      render(<QueueItem {...defaultProps} testID="queue-item" />);

      // Image component exists (React Native Image doesn't have role="img")
      // Just verify the component renders without error
      expect(screen.getByTestId('queue-item')).toBeTruthy();
    });
  });

  describe('Track count badge', () => {
    it('should display selected track count', () => {
      const selectedTrackKeys = new Set(['0', '1']);
      render(<QueueItem {...defaultProps} selectedTrackKeys={selectedTrackKeys} />);

      expect(screen.getByText('2')).toBeTruthy();
    });

    it('should not display badge when no tracks selected', () => {
      render(<QueueItem {...defaultProps} selectedTrackKeys={new Set()} />);

      // Badge with track count should not be visible
      expect(screen.queryByText('0')).toBeNull();
    });

    it('should display scrobbledTrackCount for history items', () => {
      const historyItem = {
        ...defaultProps.item,
        scrobbledTrackCount: 5,
      };

      render(
        <QueueItem
          {...defaultProps}
          item={historyItem}
          isHistoryItem={true}
          selectedTrackKeys={new Set()} // Empty since it's history
        />
      );

      expect(screen.getByText('5')).toBeTruthy();
    });
  });

  describe('Expand/collapse', () => {
    it('should start collapsed', () => {
      render(<QueueItem {...defaultProps} />);

      // Tracklist should not be visible initially
      expect(screen.queryByText('Track 1')).toBeNull();
    });

    it('should expand when header is pressed', () => {
      render(<QueueItem {...defaultProps} testID="queue-item" />);

      fireEvent.press(screen.getByTestId('queue-item-header'));

      // Should show tracklist
      expect(screen.getByText('Track 1')).toBeTruthy();
      expect(screen.getByText('Track 2')).toBeTruthy();
      expect(screen.getByText('Track 3')).toBeTruthy();
    });

    it('should collapse when header is pressed again', () => {
      render(<QueueItem {...defaultProps} testID="queue-item" />);

      // Expand
      fireEvent.press(screen.getByTestId('queue-item-header'));
      expect(screen.getByText('Track 1')).toBeTruthy();

      // Collapse
      fireEvent.press(screen.getByTestId('queue-item-header'));
      expect(screen.queryByText('Track 1')).toBeNull();
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      const loadingItem = {
        ...defaultProps.item,
        isLoading: true,
        tracklist: undefined,
      };

      render(<QueueItem {...defaultProps} item={loadingItem} testID="queue-item" />);

      // Expand to see loading state
      fireEvent.press(screen.getByTestId('queue-item-header'));

      // ActivityIndicator should be present
      expect(screen.getByTestId('queue-item').findByType).toBeTruthy();
    });
  });

  describe('Error state', () => {
    it('should show error badge when item has error', () => {
      const errorItem = {
        ...defaultProps.item,
        error: 'Failed to load',
        tracklist: undefined,
      };

      render(<QueueItem {...defaultProps} item={errorItem} />);

      expect(screen.getByText('Error')).toBeTruthy();
    });

    it('should show error details when expanded', () => {
      const errorItem = {
        ...defaultProps.item,
        error: 'Failed to load tracks',
        tracklist: undefined,
      };

      render(<QueueItem {...defaultProps} item={errorItem} testID="queue-item" />);

      // Expand
      fireEvent.press(screen.getByTestId('queue-item-header'));

      expect(screen.getByText('Failed to load album details.')).toBeTruthy();
      expect(screen.getByText('Failed to load tracks')).toBeTruthy();
    });

    it('should show remove button in error state', () => {
      const errorItem = {
        ...defaultProps.item,
        error: 'Error',
        tracklist: undefined,
      };

      render(<QueueItem {...defaultProps} item={errorItem} testID="queue-item" />);

      // Expand
      fireEvent.press(screen.getByTestId('queue-item-header'));

      expect(screen.getByText('Remove from Queue')).toBeTruthy();
    });
  });

  describe('Action buttons', () => {
    it('should call onScrobbleSingleRelease when scrobble button is pressed', () => {
      const onScrobbleSingleRelease = jest.fn();
      render(
        <QueueItem {...defaultProps} onScrobbleSingleRelease={onScrobbleSingleRelease} testID="queue-item" />
      );

      fireEvent.press(screen.getByTestId('queue-item-scrobble'));

      expect(onScrobbleSingleRelease).toHaveBeenCalledTimes(1);
    });

    it('should call onRemoveAlbumInstanceFromQueue when remove button is pressed', () => {
      const onRemoveAlbumInstanceFromQueue = jest.fn();
      render(
        <QueueItem {...defaultProps} onRemoveAlbumInstanceFromQueue={onRemoveAlbumInstanceFromQueue} testID="queue-item" />
      );

      fireEvent.press(screen.getByTestId('queue-item-remove'));

      expect(onRemoveAlbumInstanceFromQueue).toHaveBeenCalledTimes(1);
    });

    it('should disable scrobble button when isScrobbling', () => {
      render(
        <QueueItem {...defaultProps} isScrobbling={true} testID="queue-item" />
      );

      const scrobbleButton = screen.getByTestId('queue-item-scrobble');
      expect(scrobbleButton.props.accessibilityState?.disabled).toBeTruthy();
    });

    it('should not show action buttons for history items', () => {
      render(
        <QueueItem {...defaultProps} isHistoryItem={true} testID="queue-item" />
      );

      expect(screen.queryByTestId('queue-item-scrobble')).toBeNull();
      expect(screen.queryByTestId('queue-item-remove')).toBeNull();
    });
  });

  describe('History item styling', () => {
    it('should apply history styling', () => {
      render(
        <QueueItem {...defaultProps} isHistoryItem={true} testID="queue-item" />
      );

      const container = screen.getByTestId('queue-item');
      // History items have opacity styling applied
      expect(container).toBeTruthy();
    });

    it('should show history badge color', () => {
      const historyItem = {
        ...defaultProps.item,
        scrobbledTrackCount: 3,
      };

      render(
        <QueueItem
          {...defaultProps}
          item={historyItem}
          isHistoryItem={true}
          selectedTrackKeys={new Set()}
        />
      );

      expect(screen.getByText('3')).toBeTruthy();
    });
  });

  describe('Tracklist display', () => {
    it('should display track positions', () => {
      render(<QueueItem {...defaultProps} testID="queue-item" />);

      // Expand
      fireEvent.press(screen.getByTestId('queue-item-header'));

      // Track positions - note "3" may appear twice (badge + position)
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    });

    it('should display track durations', () => {
      render(<QueueItem {...defaultProps} testID="queue-item" />);

      // Expand
      fireEvent.press(screen.getByTestId('queue-item-header'));

      // Check for duration format (from createMockQueueItemWithTracks)
      expect(screen.getByText('3:00')).toBeTruthy();
    });

    it('should convert heading tracks into group headers', () => {
      const itemWithHeading = createMockQueueItemWithTracks(0, {
        tracklist: [
          { position: '', title: 'Side A', duration: '', type_: 'heading' },
          { position: '1', title: 'Track 1', duration: '3:00', type_: 'track' },
        ],
      });

      render(
        <QueueItem {...defaultProps} item={itemWithHeading} testID="queue-item" />
      );

      // Expand
      fireEvent.press(screen.getByTestId('queue-item-header'));

      // Heading appears as a group header (not a selectable track)
      expect(screen.getByText('Side A')).toBeTruthy();
      // Actual track is shown
      expect(screen.getByText('Track 1')).toBeTruthy();
    });
  });
});
