import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type {
  DiscogsTrack,
  Settings,
  DiscogsArtist,
  CombinedMetadata,
  DiscogsRelease,
} from '@libs';
import {
  getTrackFeaturedArtists,
  getTrackCreditsStructured,
  isVariousArtist,
  getDisplayArtistName,
  getArtistJoiner,
  trackStyles,
} from '@libs';
import IndeterminateCheckbox from './IndeterminateCheckbox';

// Exported for use in QueueItem to allow polymorphic prop passing
export interface TrackPassthroughProps {
  selectedTrackKeys: Set<string>;
  selectedFeatures: Set<string>;
  artistSelections: Record<string, Set<string>>;
  scrobbleTimestamps: Record<string, number>;
  settings: Settings;
  metadata: CombinedMetadata | undefined;
  onToggle: (trackKey: string) => void;
  onFeatureToggle: (trackKey: string) => void;
  onArtistToggle: (trackKey: string, artistName: string) => void;
  onToggleParent: (parentIndex: number, subTrackKeys: string[]) => void;
  onSelectParentAsSingle: (parentKey: string, subTrackKeys: string[]) => void;
  isHistoryItem?: boolean;
}

export interface TrackProps extends TrackPassthroughProps {
  track: DiscogsTrack;
  release: DiscogsRelease;
  parentIndex: number;
  groupHeading?: string;
  albumArtistName: string;
  useTrackArtist: boolean;
}

const Track: React.FC<TrackProps> = ({
  track,
  release,
  parentIndex,
  groupHeading,
  albumArtistName,
  useTrackArtist,
  ...passthroughProps
}) => {
  const {
    selectedTrackKeys,
    selectedFeatures,
    artistSelections,
    scrobbleTimestamps,
    settings,
    metadata,
    onToggle,
    onFeatureToggle,
    onArtistToggle,
    onToggleParent,
    onSelectParentAsSingle,
    isHistoryItem,
  } = passthroughProps;

  const hasSubTracks = track.sub_tracks && track.sub_tracks.length > 0;
  const trackKey = String(parentIndex);

  let isChecked: boolean;
  let isIndeterminate: boolean;
  let subTrackKeys: string[] = [];

  const featuredArtists = getTrackFeaturedArtists(track);
  const structuredCredits = getTrackCreditsStructured(track);

  if (hasSubTracks) {
    subTrackKeys = track.sub_tracks?.map((_, sIndex) => `${parentIndex}-${sIndex}`) || [];
    const numSelectedSubtracks = subTrackKeys.filter(key => selectedTrackKeys.has(key)).length;

    const isParentSelectedAsSingleTrack = selectedTrackKeys.has(trackKey) && numSelectedSubtracks === 0;
    const allSubtracksSelected = subTrackKeys.length > 0 && numSelectedSubtracks === subTrackKeys.length;
    const someSubtracksSelected = numSelectedSubtracks > 0 && !allSubtracksSelected;

    isChecked = allSubtracksSelected;
    isIndeterminate = someSubtracksSelected || isParentSelectedAsSingleTrack;
  } else {
    isChecked = selectedTrackKeys.has(trackKey);
    isIndeterminate = false;
  }

  const scrubbedPosition = (pos: string) => {
    if (!pos) return '';
    if (!groupHeading) return pos;
    const prefix = pos.match(/^([A-Z]+|^\d+-)/);
    if (prefix && groupHeading.startsWith(prefix[1].replace('-', ''))) {
      return pos.substring(prefix[1].length);
    }
    return pos;
  };

  const renderDuration = (key: string, duration: string) => {
    const timestamp = scrobbleTimestamps[key];
    const isSelected = selectedTrackKeys.has(key);

    if (!isHistoryItem && isSelected && timestamp !== undefined) {
      return (
        <Text style={[styles.duration, styles.durationScheduled]}>
          {duration}
        </Text>
      );
    }
    return <Text style={styles.duration}>{duration || '--:--'}</Text>;
  };

  const renderArtistList = (currentKey: string, artists: DiscogsArtist[] | undefined) => {
    if (!artists || artists.length === 0) return null;

    const selectedSet = artistSelections[currentKey] || new Set();

    return (
      <Text style={styles.artistText}>
        by{' '}
        {artists.map((artist, index) => {
          const displayName = getDisplayArtistName(artist.name);
          const isSelected = selectedSet.has(displayName);
          const joiner = index > 0 ? getArtistJoiner(artists[index - 1].join) : '';

          return (
            <React.Fragment key={index}>
              {joiner}
              {!isHistoryItem ? (
                <TouchableOpacity
                  onPress={() => onArtistToggle(currentKey, displayName)}
                  style={styles.artistCheckContainer}
                >
                  <View style={[styles.miniCheckbox, isSelected && styles.miniCheckboxChecked]} />
                  <Text style={[styles.artistName, isSelected && styles.artistNameSelected]}>
                    {displayName}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.artistName}>{displayName}</Text>
              )}
            </React.Fragment>
          );
        })}
      </Text>
    );
  };

  const renderCredits = (currentKey: string, credits: { role: string; artists: DiscogsArtist[] }[]) => {
    if (!credits || credits.length === 0) return null;

    return (
      <View style={styles.creditsContainer}>
        {credits.map((credit, cIndex) => (
          <View key={cIndex} style={styles.creditRow}>
            <Text style={styles.creditRole}>{credit.role}: </Text>
            {credit.artists.map((artist, aIndex) => {
              const displayName = getDisplayArtistName(artist.name);
              const joiner = aIndex > 0 ? getArtistJoiner(credit.artists[aIndex - 1].join) : '';

              return (
                <React.Fragment key={aIndex}>
                  <Text style={styles.creditArtist}>{joiner}{displayName}</Text>
                </React.Fragment>
              );
            })}
            {cIndex < credits.length - 1 && <Text style={styles.creditSeparator}>; </Text>}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.trackRow}
        onPress={() => {
          if (!isHistoryItem) {
            if (hasSubTracks) {
              onToggleParent(parentIndex, subTrackKeys);
            } else {
              onToggle(trackKey);
            }
          }
        }}
        activeOpacity={isHistoryItem ? 1 : 0.7}
      >
        {!isHistoryItem ? (
          <IndeterminateCheckbox
            checked={isChecked}
            indeterminate={isIndeterminate}
            onChange={() => {
              if (hasSubTracks) {
                onToggleParent(parentIndex, subTrackKeys);
              } else {
                onToggle(trackKey);
              }
            }}
          />
        ) : (
          <View style={styles.checkboxPlaceholder} />
        )}

        <Text style={styles.position}>{scrubbedPosition(track.position)}</Text>

        <View style={styles.trackInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{track.title}</Text>

            {!hasSubTracks && (isVariousArtist(albumArtistName) || (track.artists && track.artists.length > 0)) &&
              renderArtistList(trackKey, track.artists)
            }
          </View>

          <View style={styles.metaRow}>
            {!isHistoryItem && settings.showFeatures && featuredArtists && !hasSubTracks && (
              <TouchableOpacity
                style={styles.featureContainer}
                onPress={() => onFeatureToggle(trackKey)}
              >
                <View style={[styles.miniCheckbox, selectedFeatures.has(trackKey) && styles.miniCheckboxChecked]} />
                <Text style={styles.featureText}>{featuredArtists}</Text>
              </TouchableOpacity>
            )}
            {!isHistoryItem && hasSubTracks && (
              <TouchableOpacity
                onPress={() => onSelectParentAsSingle(trackKey, subTrackKeys)}
              >
                <Text style={styles.scrobbleAsSingleText}>(Scrobble as 1 track)</Text>
              </TouchableOpacity>
            )}
          </View>

          {!hasSubTracks && renderCredits(trackKey, structuredCredits)}
        </View>

        {renderDuration(trackKey, track.duration)}
      </TouchableOpacity>

      {hasSubTracks && (
        <View style={styles.subTracksContainer}>
          {track.sub_tracks?.map((subTrack, sIndex) => {
            const subTrackKey = `${parentIndex}-${sIndex}`;
            const subFeaturedArtists = getTrackFeaturedArtists(subTrack);
            const subStructuredCredits = getTrackCreditsStructured(subTrack);

            return (
              <TouchableOpacity
                key={sIndex}
                style={styles.trackRow}
                onPress={() => !isHistoryItem && onToggle(subTrackKey)}
                activeOpacity={isHistoryItem ? 1 : 0.7}
              >
                {!isHistoryItem ? (
                  <View style={[styles.miniCheckbox, { width: 20, height: 20 }, selectedTrackKeys.has(subTrackKey) && styles.miniCheckboxChecked]}>
                    {selectedTrackKeys.has(subTrackKey) && <View style={styles.miniCheckmark} />}
                  </View>
                ) : (
                  <View style={styles.checkboxPlaceholder} />
                )}

                <Text style={styles.position}>{scrubbedPosition(subTrack.position)}</Text>

                <View style={styles.trackInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.subTrackTitle} numberOfLines={1}>{subTrack.title}</Text>
                    {(isVariousArtist(albumArtistName) || (subTrack.artists && subTrack.artists.length > 0)) &&
                      renderArtistList(subTrackKey, subTrack.artists)
                    }
                  </View>

                  {!isHistoryItem && settings.showFeatures && subFeaturedArtists && (
                    <TouchableOpacity
                      style={styles.featureContainer}
                      onPress={() => onFeatureToggle(subTrackKey)}
                    >
                      <View style={[styles.miniCheckbox, selectedFeatures.has(subTrackKey) && styles.miniCheckboxChecked]} />
                      <Text style={styles.featureText}>{subFeaturedArtists}</Text>
                    </TouchableOpacity>
                  )}

                  {renderCredits(subTrackKey, subStructuredCredits)}
                </View>

                {renderDuration(subTrackKey, subTrack.duration)}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

// Use shared styles from libs
const styles = StyleSheet.create(trackStyles);

export default Track;
