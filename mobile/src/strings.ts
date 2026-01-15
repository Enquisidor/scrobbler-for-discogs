/**
 * Centralized string constants for the mobile app
 * Mirrors the web app strings for consistency
 * Structure inspired by i18n patterns for future localization
 */

export const STRINGS = {
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

  SETTINGS: {
    SECTIONS: {
      TRACK_SELECTION: 'Track Selection',
      FEATURES: 'Features',
      METADATA_SOURCES: 'Metadata Sources',
    },
    TRACK_SELECTION: {
      SELECT_ALL_LABEL: 'Select All Tracks',
      SELECT_ALL_DESC: 'Auto-select all tracks when adding to queue',
      SELECT_SUBTRACKS_LABEL: 'Select Subtracks',
      SELECT_SUBTRACKS_DESC: 'Include subtracks by default',
    },
    FEATURES: {
      SHOW_FEATURES_LABEL: 'Show Features',
      SHOW_FEATURES_DESC: 'Display featured artists on tracks',
      SELECT_FEATURES_LABEL: 'Select Features',
      SELECT_FEATURES_DESC: 'Include featured artists by default',
    },
    METADATA: {
      ARTIST_SOURCE_LABEL: 'Artist Source',
      ARTIST_SOURCE_DESC: 'Preferred source for artist names',
      ALBUM_SOURCE_LABEL: 'Album Source',
      ALBUM_SOURCE_DESC: 'Preferred source for album names',
    },
  },

  METADATA_SOURCES: {
    DISCOGS: 'Discogs',
    APPLE: 'Apple Music',
    MUSICBRAINZ: 'MusicBrainz',
  },

  BADGES: {
    ERROR: 'Error',
    NO_IMAGE: 'No Image',
  },
} as const;

// Helper functions for pluralization
export const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? singular : plural;
};

export const formatAlbumCount = (count: number): string => {
  return `${count} ${pluralize(count, 'album', 'albums')}`;
};

export const formatTrackCount = (count: number): string => {
  return `${count} ${pluralize(count, 'track', 'tracks')}`;
};

export const formatQueueStats = (albumCount: number, trackCount: number): string => {
  return `${formatAlbumCount(albumCount)} • ${formatTrackCount(trackCount)}`;
};
