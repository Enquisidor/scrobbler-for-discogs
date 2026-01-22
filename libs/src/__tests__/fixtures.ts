/**
 * Shared test utilities, fixtures, and mock factories
 *
 * Used by both web and mobile test suites.
 * Centralizes test data and helper functions.
 */
import type { DiscogsRelease, QueueItem, Settings, DiscogsTrack, Credentials } from '../types';

// ==================== Default Settings ====================

export const defaultSettings: Settings = {
  selectAllTracksPerRelease: true,
  selectSubtracksByDefault: true,
  showFeatures: true,
  selectFeaturesByDefault: false,
  artistSource: 'discogs',
  albumSource: 'discogs',
};

export const customSettings: Settings = {
  selectAllTracksPerRelease: false,
  selectSubtracksByDefault: false,
  showFeatures: false,
  selectFeaturesByDefault: true,
  artistSource: 'apple',
  albumSource: 'musicbrainz',
};

// ==================== Default Credentials ====================

export const emptyCredentials: Credentials = {
  discogsAccessToken: '',
  discogsAccessTokenSecret: '',
  discogsUsername: '',
  lastfmSessionKey: '',
  lastfmUsername: '',
  lastfmApiKey: '',
  lastfmSecret: '',
};

export const connectedCredentials: Credentials = {
  discogsAccessToken: 'test_token',
  discogsAccessTokenSecret: 'test_token_secret',
  discogsUsername: 'testuser',
  lastfmSessionKey: 'test_session_key',
  lastfmUsername: 'lastfmuser',
  lastfmApiKey: 'test_api_key',
  lastfmSecret: 'test_secret',
};

// ==================== Mock Discogs Releases ====================

export const createMockRelease = (overrides: Partial<DiscogsRelease> = {}): DiscogsRelease => ({
  id: overrides.id ?? Math.floor(Math.random() * 1000000),
  instance_id: Math.floor(Math.random() * 1000000),
  date_added: new Date().toISOString(),
  basic_information: {
    title: 'Test Album',
    year: 2023,
    cover_image: 'https://example.com/cover.jpg',
    thumb: 'https://example.com/thumb.jpg',
    artist_display_name: 'Test Artist',
    artists: [{ name: 'Test Artist', id: 1, anv: '', join: '', resource_url: '' }],
    formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP', '12"'] }],
    labels: [{
      name: 'Test Label', catno: 'TL001', id: 1
    }],
  },
  ...overrides,
});

export const createMockReleaseWithTracks = (
  trackCount: number = 3,
  overrides: Partial<DiscogsRelease> = {}
): DiscogsRelease => {
  const tracks: DiscogsTrack[] = Array.from({ length: trackCount }, (_, i) => ({
    position: `${i + 1}`,
    title: `Track ${i + 1}`,
    duration: `3:${String(i * 10).padStart(2, '0')}`,
    type_: 'track',
  }));

  return createMockRelease({
    ...overrides,
    // Note: tracks are stored at QueueItem level after tracklist fetch
  });
};

// ==================== Mock Queue Items ====================

export const createMockQueueItem = (overrides: Partial<QueueItem> = {}): QueueItem => {
  const release = createMockRelease();
  return {
    ...release,
    instanceKey: `${release.id}-${Date.now()}-${Math.random()}`,
    tracklist: undefined,
    isLoading: false,
    useTrackArtist: true,
    ...overrides,
  };
};

export const createMockQueueItemWithTracks = (
  trackCount: number = 3,
  overrides: Partial<QueueItem> = {}
): QueueItem => {
  const tracks: DiscogsTrack[] = Array.from({ length: trackCount }, (_, i) => ({
    position: `${i + 1}`,
    title: `Track ${i + 1}`,
    duration: `3:${String(i * 10).padStart(2, '0')}`,
    type_: 'track',
  }));

  return createMockQueueItem({
    tracklist: tracks,
    isLoading: false,
    ...overrides,
  });
};

export const createMockQueueItemWithSubtracks = (overrides: Partial<QueueItem> = {}): QueueItem => {
  const tracks: DiscogsTrack[] = [
    {
      position: '1',
      title: 'Parent Track 1',
      duration: '10:00',
      type_: 'track',
      sub_tracks: [
        { position: '1a', title: 'Subtrack 1a', duration: '3:00', type_: 'track' },
        { position: '1b', title: 'Subtrack 1b', duration: '3:30', type_: 'track' },
        { position: '1c', title: 'Subtrack 1c', duration: '3:30', type_: 'track' },
      ],
    },
    {
      position: '2',
      title: 'Regular Track 2',
      duration: '4:00',
      type_: 'track',
    },
    {
      position: '',
      title: 'Side B',
      duration: '',
      type_: 'heading',
    },
    {
      position: '3',
      title: 'Parent Track 3',
      duration: '8:00',
      type_: 'track',
      sub_tracks: [
        { position: '3a', title: 'Subtrack 3a', duration: '4:00', type_: 'track' },
        { position: '3b', title: 'Subtrack 3b', duration: '4:00', type_: 'track' },
      ],
    },
  ];

  return createMockQueueItem({
    tracklist: tracks,
    isLoading: false,
    ...overrides,
  });
};

export const createMockQueueItemWithFeatures = (overrides: Partial<QueueItem> = {}): QueueItem => {
  const tracks: DiscogsTrack[] = [
    {
      position: '1',
      title: 'Track with Feature',
      duration: '4:00',
      type_: 'track',
      artists: [{ name: 'Main Artist', id: 1, anv: '', join: '', resource_url: '' }],
      extraartists: [
        { name: 'Featured Artist', id: 2, anv: '', join: '', role: 'Featuring' },
      ],
    },
    {
      position: '2',
      title: 'Track without Feature',
      duration: '3:30',
      type_: 'track',
    },
    {
      position: '3',
      title: 'Another Featured Track',
      duration: '3:45',
      type_: 'track',
      extraartists: [
        { name: 'Guest Vocalist', id: 3, anv: '', join: '', role: 'feat' },
      ],
    },
  ];

  return createMockQueueItem({
    tracklist: tracks,
    isLoading: false,
    ...overrides,
  });
};

// ==================== Mock API Responses ====================

export const createMockCollectionResponse = (
  page: number = 1,
  totalPages: number = 1,
  releasesPerPage: number = 50
) => ({
  pagination: {
    page,
    pages: totalPages,
    items: totalPages * releasesPerPage,
    per_page: releasesPerPage,
  },
  releases: Array.from({ length: releasesPerPage }, (_, i) =>
    createMockRelease({
      id: (page - 1) * releasesPerPage + i + 1,
    })
  ),
});

// ==================== Mock Fetch Helper ====================

export const createMockFetch = (responses: Record<string, any> = {}) => {
  return jest.fn((url: string, options?: RequestInit) => {
    const defaultResponse = { ok: true, json: () => Promise.resolve({}) };

    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        if (response instanceof Error) {
          return Promise.reject(response);
        }
        if (response.status && response.status >= 400) {
          return Promise.resolve({
            ok: false,
            status: response.status,
            json: () => Promise.resolve(response.body || { message: 'Error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(typeof response === 'string' ? response : JSON.stringify(response)),
        });
      }
    }

    return Promise.resolve(defaultResponse);
  });
};

// ==================== Wait Utilities ====================

export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> => {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};
