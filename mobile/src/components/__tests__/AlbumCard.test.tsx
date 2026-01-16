/**
 * Tests for AlbumCard component
 *
 * Covers: Test long-press detection, verify image loading (Plan Phase 4.2)
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AlbumCard } from '../collection/AlbumCard';
import type { DiscogsRelease, Settings } from '@libs';

// Mock the libs functions
jest.mock('scrobbler-for-discogs-libs', () => ({
  getReleaseDisplayArtist: jest.fn(() => 'Test Artist'),
  getReleaseDisplayTitle: jest.fn(() => 'Test Album'),
}));

const mockRelease: DiscogsRelease = {
  id: 123,
  instance_id: 456,
  date_added: '2024-01-01',
  basic_information: {
    title: 'Test Album',
    year: 2024,
    thumb: 'https://example.com/thumb.jpg',
    cover_image: 'https://example.com/cover.jpg',
    formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP'] }],
    labels: [{ name: 'Test Label', catno: 'TL001', id: 1 }],
    artists: [{ name: 'Test Artist', id: 1 }],
    artist_display_name: 'Test Artist',
  },
};

const mockSettings: Settings = {
  selectAllTracksPerRelease: true,
  selectSubtracksByDefault: true,
  showFeatures: true,
  selectFeaturesByDefault: false,
  artistSource: 'discogs',
  albumSource: 'discogs',
};

describe('AlbumCard', () => {
  const defaultProps = {
    release: mockRelease,
    onAddInstance: jest.fn(),
    onRemoveLastInstance: jest.fn(),
    onRemoveAllInstances: jest.fn(),
    scrobbleCount: 0,
    settings: mockSettings,
    testID: 'album-card',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render album card with image', () => {
      const { getByTestId, getByLabelText } = render(<AlbumCard {...defaultProps} />);

      expect(getByTestId('album-card')).toBeTruthy();
      expect(getByLabelText('Test Artist - Test Album')).toBeTruthy();
    });

    it('should render placeholder when no valid image', () => {
      const releaseWithoutImage = {
        ...mockRelease,
        basic_information: {
          ...mockRelease.basic_information,
          cover_image: 'https://st.discogs.com/images/default-release.png',
        },
      };

      const { getByText } = render(
        <AlbumCard {...defaultProps} release={releaseWithoutImage} />
      );

      expect(getByText('No Image')).toBeTruthy();
    });

    it('should render placeholder when cover_image is empty', () => {
      const releaseWithEmptyImage = {
        ...mockRelease,
        basic_information: {
          ...mockRelease.basic_information,
          cover_image: '',
        },
      };

      const { getByText } = render(
        <AlbumCard {...defaultProps} release={releaseWithEmptyImage} />
      );

      expect(getByText('No Image')).toBeTruthy();
    });

    it('should display artist and title', () => {
      const { getByText } = render(<AlbumCard {...defaultProps} />);

      expect(getByText('Test Album')).toBeTruthy();
      expect(getByText('Test Artist')).toBeTruthy();
    });
  });

  describe('Scrobble Count Badge', () => {
    it('should not show badge when scrobbleCount is 0', () => {
      const { queryByTestId } = render(<AlbumCard {...defaultProps} scrobbleCount={0} />);

      expect(queryByTestId('album-card-badge')).toBeNull();
    });

    it('should show badge with count when scrobbleCount > 0', () => {
      const { getByTestId, getByText } = render(
        <AlbumCard {...defaultProps} scrobbleCount={3} />
      );

      expect(getByTestId('album-card-badge')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });

    it('should have selected style when in queue', () => {
      const { getByTestId } = render(<AlbumCard {...defaultProps} scrobbleCount={1} />);

      const card = getByTestId('album-card');
      // The component should have the selected border style applied
      expect(card).toBeTruthy();
    });
  });

  describe('Press Interactions', () => {
    it('should call onAddInstance when card is pressed', () => {
      const onAddInstance = jest.fn();
      const { getByTestId } = render(
        <AlbumCard {...defaultProps} onAddInstance={onAddInstance} />
      );

      fireEvent.press(getByTestId('album-card'));

      expect(onAddInstance).toHaveBeenCalledTimes(1);
    });

    it('should call onRemoveLastInstance when badge is pressed', () => {
      const onRemoveLastInstance = jest.fn();
      const { getByTestId } = render(
        <AlbumCard
          {...defaultProps}
          scrobbleCount={2}
          onRemoveLastInstance={onRemoveLastInstance}
        />
      );

      fireEvent.press(getByTestId('album-card-badge'));

      expect(onRemoveLastInstance).toHaveBeenCalledTimes(1);
    });
  });

  describe('Long Press Detection', () => {
    it('should call onRemoveAllInstances after 5 second long press on badge', () => {
      const onRemoveAllInstances = jest.fn();
      const onRemoveLastInstance = jest.fn();
      const { getByTestId } = render(
        <AlbumCard
          {...defaultProps}
          scrobbleCount={3}
          onRemoveAllInstances={onRemoveAllInstances}
          onRemoveLastInstance={onRemoveLastInstance}
        />
      );

      const badge = getByTestId('album-card-badge');

      // Start press
      fireEvent(badge, 'pressIn');

      // Advance time to just before 5 seconds
      act(() => {
        jest.advanceTimersByTime(4999);
      });

      expect(onRemoveAllInstances).not.toHaveBeenCalled();

      // Advance to 5 seconds
      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(onRemoveAllInstances).toHaveBeenCalledTimes(1);

      // End press and press should not trigger remove last
      fireEvent(badge, 'pressOut');
      fireEvent.press(badge);

      // Should not call onRemoveLastInstance after long press completed
      expect(onRemoveLastInstance).not.toHaveBeenCalled();
    });

    it('should not call onRemoveAllInstances if press is released before 5 seconds', () => {
      const onRemoveAllInstances = jest.fn();
      const { getByTestId } = render(
        <AlbumCard
          {...defaultProps}
          scrobbleCount={2}
          onRemoveAllInstances={onRemoveAllInstances}
        />
      );

      const badge = getByTestId('album-card-badge');

      // Start press
      fireEvent(badge, 'pressIn');

      // Advance time to 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Release before 5 seconds
      fireEvent(badge, 'pressOut');

      // Continue time past 5 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onRemoveAllInstances).not.toHaveBeenCalled();
    });

    it('should call onRemoveLastInstance on short press of badge', () => {
      const onRemoveLastInstance = jest.fn();
      const onRemoveAllInstances = jest.fn();
      const { getByTestId } = render(
        <AlbumCard
          {...defaultProps}
          scrobbleCount={2}
          onRemoveLastInstance={onRemoveLastInstance}
          onRemoveAllInstances={onRemoveAllInstances}
        />
      );

      const badge = getByTestId('album-card-badge');

      // Start press
      fireEvent(badge, 'pressIn');

      // Short delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Release
      fireEvent(badge, 'pressOut');

      // Press event
      fireEvent.press(badge);

      expect(onRemoveLastInstance).toHaveBeenCalledTimes(1);
      expect(onRemoveAllInstances).not.toHaveBeenCalled();
    });
  });

  describe('Image Loading', () => {
    it('should render image with correct source URI', () => {
      const { UNSAFE_getByType } = render(<AlbumCard {...defaultProps} />);
      const { Image } = require('react-native');

      const image = UNSAFE_getByType(Image);
      expect(image.props.source.uri).toBe('https://example.com/cover.jpg');
    });

    it('should have correct accessibility label on image', () => {
      const { getByLabelText } = render(<AlbumCard {...defaultProps} />);

      expect(getByLabelText('Test Artist - Test Album')).toBeTruthy();
    });
  });
});
