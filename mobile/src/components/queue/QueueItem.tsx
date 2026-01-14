import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { QueueItem as QueueItemType, Settings, CombinedMetadata } from 'scrobbler-for-discogs-libs';
import { getReleaseDisplayArtist, getReleaseDisplayTitle } from 'scrobbler-for-discogs-libs';

interface QueueItemProps {
  item: QueueItemType;
  selectedTrackKeys: Set<string>;
  settings: Settings;
  metadata?: CombinedMetadata;
  onRemove: () => void;
  onScrobble: () => void;
  onToggleExpand?: () => void;
  isScrobbling: boolean;
  isHistoryItem?: boolean;
  testID?: string;
}

export const QueueItem: React.FC<QueueItemProps> = ({
  item,
  selectedTrackKeys,
  settings,
  metadata,
  onRemove,
  onScrobble,
  onToggleExpand,
  isScrobbling,
  isHistoryItem = false,
  testID,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const artistName = getReleaseDisplayArtist(item, metadata, settings);
  const title = getReleaseDisplayTitle(item, metadata, settings);

  const trackCount = useMemo(() => {
    if (isHistoryItem && item.scrobbledTrackCount) {
      return item.scrobbledTrackCount;
    }
    return selectedTrackKeys.size;
  }, [isHistoryItem, item.scrobbledTrackCount, selectedTrackKeys.size]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    onToggleExpand?.();
  };

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
        onPress={handleToggleExpand}
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
            {isExpanded ? '▲' : '▼'}
          </Text>

          {!isHistoryItem && (
            <>
              <Pressable
                testID={testID ? `${testID}-scrobble` : undefined}
                style={[styles.actionButton, isScrobbling && styles.actionButtonDisabled]}
                onPress={onScrobble}
                disabled={isScrobbling}
              >
                {isScrobbling ? (
                  <ActivityIndicator size="small" color="#22c55e" />
                ) : (
                  <Text style={styles.scrobbleIcon}>✓</Text>
                )}
              </Pressable>

              <Pressable
                testID={testID ? `${testID}-remove` : undefined}
                style={styles.actionButton}
                onPress={onRemove}
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
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          )}

          {item.error && !isHistoryItem && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Failed to load album details.</Text>
              <Text style={styles.errorMessage}>{item.error}</Text>
              <Pressable style={styles.removeButton} onPress={onRemove}>
                <Text style={styles.removeButtonText}>Remove from Queue</Text>
              </Pressable>
            </View>
          )}

          {!item.error && item.tracklist && (
            <View style={styles.tracklist}>
              {item.tracklist
                .filter(track => track.type_ !== 'heading')
                .map((track, index) => (
                  <View key={index} style={styles.trackRow}>
                    <Text style={styles.trackPosition}>{track.position || '-'}</Text>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackDuration}>{track.duration || ''}</Text>
                  </View>
                ))}
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
  tracklist: {
    marginTop: 8,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  trackPosition: {
    color: '#6b7280',
    fontSize: 12,
    width: 32,
  },
  trackTitle: {
    flex: 1,
    color: '#d1d5db',
    fontSize: 13,
  },
  trackDuration: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default QueueItem;
