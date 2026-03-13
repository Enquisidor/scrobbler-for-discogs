import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import type { QueueItem as QueueItemType, DiscogsTrack } from '@libs';
import {
  getReleaseDisplayArtist,
  getReleaseDisplayTitle,
  isVariousArtist,
  assignGroups,
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '@libs';
import Track, { TrackPassthroughProps } from './Track';
import IndeterminateCheckbox from './IndeterminateCheckbox';

interface QueueItemProps extends TrackPassthroughProps {
  item: QueueItemType;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleGroup: (groupKeys: string[], parentKeysInGroup: string[]) => void;
  onRemoveAlbumInstanceFromQueue: () => void;
  onScrobbleModeToggle: (useTrackArtist: boolean) => void;
  onScrobbleSingleRelease: () => void;
  isScrobbling: boolean;
  testID?: string;
}

export const QueueItem: React.FC<QueueItemProps> = ({
  item,
  onSelectAll,
  onDeselectAll,
  onToggleGroup,
  onRemoveAlbumInstanceFromQueue,
  onScrobbleModeToggle,
  onScrobbleSingleRelease,
  isScrobbling,
  testID,
  ...trackPassthroughProps
}) => {
  const {
    selectedTrackKeys,
    settings,
    metadata,
    isHistoryItem,
  } = trackPassthroughProps;

  const [isExpanded, setIsExpanded] = useState(false);

  const artistName = getReleaseDisplayArtist(item, metadata, settings);
  const title = getReleaseDisplayTitle(item, metadata, settings);

  const isVarious = useMemo(() => {
    if (isVariousArtist(artistName)) return true;
    return item.basic_information.artists?.some(a => isVariousArtist(a.name)) ?? false;
  }, [artistName, item.basic_information.artists]);

  const processedTracklist = useMemo(() => {
    if (!isHistoryItem || !item.scrobbledTrackKeys || !item.tracklist) {
      return item.tracklist;
    }

    const scrobbledKeysSet = new Set(item.scrobbledTrackKeys);
    const newTracklist: DiscogsTrack[] = [];

    item.tracklist.forEach((track, pIndex) => {
      const trackKey = String(pIndex);

      if (track.sub_tracks && track.sub_tracks.length > 0) {
        if (scrobbledKeysSet.has(trackKey)) {
          newTracklist.push({ ...track, sub_tracks: [] });
          return;
        }

        const scrobbledSubTracks = track.sub_tracks.filter((_sub, sIndex) => {
          const subKey = `${pIndex}-${sIndex}`;
          return scrobbledKeysSet.has(subKey);
        });

        if (scrobbledSubTracks.length > 0) {
          newTracklist.push({ ...track, sub_tracks: scrobbledSubTracks });
        }
      } else if (scrobbledKeysSet.has(trackKey)) {
        newTracklist.push(track);
      } else if (track.type_ === 'heading') {
        newTracklist.push(track);
      }
    });

    return newTracklist.filter((track, index, arr) => {
      if (track.type_ === 'heading') {
        const nextTrack = arr[index + 1];
        return nextTrack && nextTrack.type_ !== 'heading';
      }
      return true;
    });
  }, [isHistoryItem, item.tracklist, item.scrobbledTrackKeys]);

  const trackGroups = useMemo(() => assignGroups(processedTracklist ?? null), [processedTracklist]);

  const allSelectableKeys = useMemo(() => {
    const keys: string[] = [];
    item.tracklist?.forEach((track, pIndex) => {
      if (track.type_ === 'heading') return;
      if (track.sub_tracks?.length) {
        track.sub_tracks.forEach((_, sIndex) => keys.push(`${pIndex}-${sIndex}`));
      } else {
        keys.push(String(pIndex));
      }
    });
    return keys;
  }, [item.tracklist]);

  const numSelected = selectedTrackKeys.size;
  const allTracksSelected = allSelectableKeys.length > 0 && numSelected === allSelectableKeys.length;

  const handleToggleAll = () => allTracksSelected ? onDeselectAll() : onSelectAll();

  const trackCount = useMemo(() => {
    if (isHistoryItem && item.scrobbledTrackCount) {
      return item.scrobbledTrackCount;
    }
    return selectedTrackKeys.size;
  }, [isHistoryItem, item.scrobbledTrackCount, selectedTrackKeys.size]);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        item.error && styles.containerError,
        isHistoryItem && styles.containerHistory,
      ]}
    >
      {/* Header */}
      <Pressable
        testID={testID ? `${testID}-header` : undefined}
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Image
          source={{ uri: item.basic_information.cover_image }}
          style={styles.coverImage}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artistName}
          </Text>
        </View>

        <View style={styles.actions}>
          {item.error && (
            <Text style={styles.errorBadge}>Error</Text>
          )}

          {!item.error && trackCount > 0 && (
            <View style={[styles.badge, isHistoryItem && styles.badgeHistory]}>
              <Text style={styles.badgeText}>{trackCount}</Text>
            </View>
          )}

          {/* Expand/Collapse indicator */}
          <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>
            ▼
          </Text>

          {!isHistoryItem && (
            <>
              <Pressable
                testID={testID ? `${testID}-scrobble` : undefined}
                style={[styles.actionButton, isScrobbling && styles.actionButtonDisabled]}
                onPress={onScrobbleSingleRelease}
                disabled={isScrobbling}
              >
                {isScrobbling ? (
                  <ActivityIndicator size="small" color={colors.success} />
                ) : (
                  <Text style={styles.scrobbleIcon}>✓</Text>
                )}
              </Pressable>

              <Pressable
                testID={testID ? `${testID}-remove` : undefined}
                style={styles.actionButton}
                onPress={onRemoveAlbumInstanceFromQueue}
              >
                <Text style={styles.removeIcon}>✕</Text>
              </Pressable>
            </>
          )}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {item.isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {item.error && !isHistoryItem && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Failed to load album details.</Text>
              <Text style={styles.errorMessage}>{item.error}</Text>
              <Pressable style={styles.removeButton} onPress={onRemoveAlbumInstanceFromQueue}>
                <Text style={styles.removeButtonText}>Remove from Queue</Text>
              </Pressable>
            </View>
          )}

          {!item.error && processedTracklist && (
            <View style={styles.tracklistContainer}>
              {/* Select All / Scrobble Mode Controls */}
              <View style={styles.controlsRow}>
                {!isHistoryItem && (
                  <TouchableOpacity
                    style={styles.selectAllRow}
                    onPress={handleToggleAll}
                  >
                    <IndeterminateCheckbox
                      checked={allTracksSelected}
                      indeterminate={false}
                      onChange={handleToggleAll}
                      size={16}
                    />
                    <Text style={styles.selectAllText}>
                      {allTracksSelected ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                )}

                {!isHistoryItem && isVarious && (
                  <View style={styles.scrobbleModeContainer}>
                    <Text style={styles.scrobbleModeLabel}>Track Artists</Text>
                    <Switch
                      value={item.useTrackArtist}
                      onValueChange={onScrobbleModeToggle}
                      trackColor={{ false: colors.gray[600], true: colors.primary }}
                      thumbColor={colors.white}
                    />
                  </View>
                )}
              </View>

              {/* Track Groups */}
              {trackGroups.map((group, groupIndex) => {
                const selectableGroupKeys = group.tracks.flatMap(({ track, originalIndex: pIndex }) => {
                  if (track.sub_tracks?.length) return track.sub_tracks.map((_, sIndex) => `${pIndex}-${sIndex}`);
                  if (track.type_ !== 'heading') return [String(pIndex)];
                  return [];
                });
                const parentKeysInGroup = group.tracks
                  .filter(({ track }) => track.sub_tracks && track.sub_tracks.length > 0)
                  .map(({ originalIndex }) => String(originalIndex));

                const numSelectedInGroup = selectableGroupKeys.filter(key => selectedTrackKeys.has(key)).length;
                const allInGroupSelected = selectableGroupKeys.length > 0 && numSelectedInGroup === selectableGroupKeys.length;
                const someInGroupSelected = numSelectedInGroup > 0 && numSelectedInGroup < selectableGroupKeys.length;

                return (
                  <View key={groupIndex} style={styles.groupContainer}>
                    {group.heading && (
                      <View style={styles.groupHeader}>
                        <Text style={styles.groupHeading}>{group.heading}</Text>
                        {!isHistoryItem && (
                          <TouchableOpacity
                            style={styles.groupSelectRow}
                            onPress={() => onToggleGroup(selectableGroupKeys, parentKeysInGroup)}
                          >
                            <IndeterminateCheckbox
                              checked={allInGroupSelected}
                              indeterminate={someInGroupSelected}
                              onChange={() => onToggleGroup(selectableGroupKeys, parentKeysInGroup)}
                              disabled={selectableGroupKeys.length === 0}
                              size={16}
                            />
                            <Text style={styles.groupSelectText}>
                              {allInGroupSelected ? 'Deselect Side' : 'Select Side'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    <View>
                      {group.tracks.map(({ track, originalIndex }) =>
                        track.type_ !== 'heading' && (
                          <Track
                            key={originalIndex}
                            track={track}
                            release={item}
                            parentIndex={originalIndex}
                            groupHeading={group.heading}
                            albumArtistName={artistName}
                            useTrackArtist={item.useTrackArtist}
                            {...trackPassthroughProps}
                          />
                        )
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  containerError: {
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  containerHistory: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  coverImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artist: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  errorBadge: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  badge: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeHistory: {
    backgroundColor: '#4b5563',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chevron: {
    color: '#9ca3af',
    fontSize: 12,
    paddingHorizontal: 4,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  scrobbleIcon: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeIcon: {
    color: '#9ca3af',
    fontSize: 14,
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(185, 28, 28, 0.2)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorMessage: {
    color: '#fca5a5',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#b91c1c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tracklistContainer: {
    marginTop: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  scrobbleModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrobbleModeLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  groupContainer: {
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 4,
  },
  groupHeading: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupSelectText: {
    color: '#9ca3af',
    fontSize: 11,
  },
});