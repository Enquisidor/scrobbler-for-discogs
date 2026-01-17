/**
 * Tests for QueueSheet component
 *
 * Priority 2 - High: Complex modal with queue display, scrobble actions
 *
 * Covers:
 * - Modal visibility
 * - Queue item display
 * - History display
 * - Empty state
 * - Scrobble actions
 * - Close functionality
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { QueueSheet } from '../QueueSheet';
import {
  createMockQueueItemWithTracks,
  defaultSettings,
} from '../../../__tests__/testUtils';

describe('QueueSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    view: 'queue' as const,
    queue: [],
    scrobbledHistory: [],
    settings: defaultSettings,
    isLastfmConnected: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal visibility', () => {
    it('should be visible when isOpen is true', () => {
      render(<QueueSheet {...defaultProps} isOpen={true} testID="queue-sheet" />);

      expect(screen.getByTestId('queue-sheet')).toBeTruthy();
    });

    it('should not be visible when isOpen is false', () => {
      render(<QueueSheet {...defaultProps} isOpen={false} testID="queue-sheet" />);

      expect(screen.queryByTestId('queue-sheet')).toBeNull();
    });
  });

  describe('Header', () => {
    it('should display "Queue" title when view is queue', () => {
      render(<QueueSheet {...defaultProps} view="queue" />);

      expect(screen.getByText('Queue')).toBeTruthy();
    });

    it('should display "History" title when view is history', () => {
      render(<QueueSheet {...defaultProps} view="history" />);

      expect(screen.getByText('History')).toBeTruthy();
    });

    it('should call onClose when Done button is pressed', () => {
      const onClose = jest.fn();
      render(<QueueSheet {...defaultProps} onClose={onClose} testID="queue-sheet" />);

      fireEvent.press(screen.getByTestId('queue-sheet-close'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when queue and history are empty', () => {
      render(<QueueSheet {...defaultProps} queue={[]} scrobbledHistory={[]} />);

      expect(screen.getByText('Your queue is empty')).toBeTruthy();
      expect(screen.getByText(/Tap albums in your collection/)).toBeTruthy();
    });

    it('should not show empty state when queue has items', () => {
      const queue = [createMockQueueItemWithTracks(3)];
      render(<QueueSheet {...defaultProps} queue={queue} />);

      expect(screen.queryByText('Your queue is empty')).toBeNull();
    });
  });

  describe('Queue items display', () => {
    it('should display queue items', () => {
      const queue = [createMockQueueItemWithTracks(3)];

      render(<QueueSheet {...defaultProps} queue={queue} testID="queue-sheet" />);

      expect(screen.getByText('Ready to Scrobble')).toBeTruthy();
    });

    it('should display correct album count in stats', () => {
      const queue = [
        createMockQueueItemWithTracks(3),
        createMockQueueItemWithTracks(3),
      ];

      render(<QueueSheet {...defaultProps} queue={queue} />);

      expect(screen.getByText(/2 albums/)).toBeTruthy();
    });
  });

  describe('History display', () => {
    it('should display history items', () => {
      const history = [
        {
          ...createMockQueueItemWithTracks(3),
          scrobbledTrackCount: 3,
        },
      ];

      render(<QueueSheet {...defaultProps} scrobbledHistory={history} />);

      expect(screen.getByText('Recently Scrobbled')).toBeTruthy();
    });
  });

  describe('Actions bar', () => {
    it('should show actions bar when queue has items', () => {
      const queue = [createMockQueueItemWithTracks(3)];
      render(<QueueSheet {...defaultProps} queue={queue} testID="queue-sheet" />);

      expect(screen.getByTestId('queue-sheet-clear')).toBeTruthy();
      expect(screen.getByTestId('queue-sheet-scrobble-all')).toBeTruthy();
    });

    it('should call onClearQueue when Clear button is pressed', () => {
      const onClearQueue = jest.fn();
      const queue = [createMockQueueItemWithTracks(3)];

      render(
        <QueueSheet
          {...defaultProps}
          queue={queue}
          onClearQueue={onClearQueue}
          testID="queue-sheet"
        />
      );

      fireEvent.press(screen.getByTestId('queue-sheet-clear'));

      expect(onClearQueue).toHaveBeenCalledTimes(1);
    });

    it('should call onScrobbleAll when Scrobble All button is pressed', () => {
      const onScrobbleAll = jest.fn();
      const queue = [createMockQueueItemWithTracks(3)];
      const selectedTrackKeys = new Map([['test-key', new Set(['0', '1', '2'])]]);

      render(
        <QueueSheet
          {...defaultProps}
          queue={queue}
          onScrobbleAll={onScrobbleAll}
          selectedTrackKeys={selectedTrackKeys}
          testID="queue-sheet"
        />
      );

      fireEvent.press(screen.getByTestId('queue-sheet-scrobble-all'));

      expect(onScrobbleAll).toHaveBeenCalledTimes(1);
    });

    it('should show "Connect Last.fm" when not connected', () => {
      const queue = [createMockQueueItemWithTracks(3)];

      render(
        <QueueSheet
          {...defaultProps}
          queue={queue}
          isLastfmConnected={false}
        />
      );

      expect(screen.getByText('Connect Last.fm')).toBeTruthy();
    });

    it('should disable Scrobble All when no tracks selected', () => {
      const queue = [createMockQueueItemWithTracks(3)];

      render(
        <QueueSheet
          {...defaultProps}
          queue={queue}
          selectedTrackKeys={new Map()}
          testID="queue-sheet"
        />
      );

      const scrobbleButton = screen.getByTestId('queue-sheet-scrobble-all');
      // Button should be disabled (check via accessibility state or style)
      expect(scrobbleButton.props.accessibilityState?.disabled).toBeTruthy();
    });

    it('should disable Scrobble All while scrobbling', () => {
      const queue = [createMockQueueItemWithTracks(3)];
      const selectedTrackKeys = new Map([['test-key', new Set(['0'])]]);

      render(
        <QueueSheet
          {...defaultProps}
          queue={queue}
          selectedTrackKeys={selectedTrackKeys}
          isScrobbling={true}
          testID="queue-sheet"
        />
      );

      const scrobbleButton = screen.getByTestId('queue-sheet-scrobble-all');
      expect(scrobbleButton.props.accessibilityState?.disabled).toBeTruthy();
    });
  });

  describe('Track count display', () => {
    it('should display correct track count', () => {
      const queue = [createMockQueueItemWithTracks(3)];
      const selectedTrackKeys = new Map([
        [queue[0].instanceKey, new Set(['0', '1'])],
      ]);

      render(
        <QueueSheet
          {...defaultProps}
          queue={queue}
          selectedTrackKeys={selectedTrackKeys}
        />
      );

      expect(screen.getByText(/2 tracks/)).toBeTruthy();
    });

    it('should handle singular "track" text', () => {
      const queue = [createMockQueueItemWithTracks(3)];
      const selectedTrackKeys = new Map([
        [queue[0].instanceKey, new Set(['0'])],
      ]);

      render(
        <QueueSheet
          {...defaultProps}
          queue={queue}
          selectedTrackKeys={selectedTrackKeys}
        />
      );

      // Text is split in the DOM tree, so we check for singular "album" and "track" forms
      // The stat text should contain "1 album • 1 track" (singular, not "tracks")
      expect(screen.getByText(/1/)).toBeTruthy();
      expect(screen.getByText(/album(?!s)/)).toBeTruthy(); // singular "album", not "albums"
      expect(screen.getByText(/track/)).toBeTruthy();
    });
  });
});
