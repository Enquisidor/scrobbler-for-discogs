// --- Shared Enums ---
export enum SortOption {
  AddedNewest = 'added_newest',
  AddedOldest = 'added_oldest',
  ArtistAZ = 'artist_az',
  ArtistZA = 'artist_za',
  AlbumAZ = 'album_az',
  AlbumZA = 'album_za',
  YearNewest = 'year_newest',
  YearOldest = 'year_oldest',
  LabelAZ = 'label_az',
  LabelZA = 'label_za',
  FormatAZ = 'format_az',
  FormatZA = 'format_za',
  CatNoAZ = 'catno_az',
  CatNoZA = 'catno_za',
  SearchRelevance = 'search_relevance',
}

// --- Discogs API Types ---
export interface DiscogsArtist {
  id: number;
  name: string;
  join?: string;
  resource_url?: string;
}

export interface DiscogsExtraArtist {
  id: number;
  name: string;
  role: string;
  join: string;
}

export interface DiscogsFormat {
  name: string;
  qty: string;
  descriptions?: string[];
}

export interface DiscogsLabel {
  name: string;
  catno: string;
  id: number;
}

export interface DiscogsTrack {
  position: string;
  title: string;
  duration: string;
  type_?: string;
  sub_tracks?: DiscogsTrack[];
  artists?: DiscogsArtist[];
  extraartists?: DiscogsExtraArtist[];
}

export interface DiscogsReleaseBasic {
  id: number;
  title: string;
  artists: DiscogsArtist[];
  year: number;
  thumb: string;
  cover_image: string;
  formats: DiscogsFormat[];
  labels: DiscogsLabel[];
  artist_display_name: string;
}

export interface DiscogsRelease {
  id: number;
  instance_id: number;
  date_added: string;
  basic_information: DiscogsReleaseBasic;
  tracklist?: DiscogsTrack[];
}

// --- App-specific Types ---
export interface Credentials {
  discogsUsername: string;
  discogsAccessToken: string;
  discogsAccessTokenSecret: string;
  lastfmApiKey: string;
  lastfmSecret: string;
  lastfmSessionKey: string;
  lastfmUsername: string;
}

export interface Settings {
  selectAllTracksPerRelease: boolean;
  selectSubtracksByDefault: boolean;
  showFeatures: boolean;
  selectFeaturesByDefault: boolean;
}

export interface EnrichedTrack extends Omit<DiscogsTrack, 'sub_tracks'> {
  display_artist: string;
  featured_artists: string;
  sub_tracks?: EnrichedTrack[];
}

export interface QueueItem extends DiscogsRelease {
  tracklist: EnrichedTrack[] | null;
  isLoading: boolean;
}

export type SelectedTracks = Record<number, Set<string>>;
export type SelectedFeatures = Record<number, Set<string>>;

export interface LastfmTrackScrobble {
  artist: string;
  track: string;
  timestamp: number;
}