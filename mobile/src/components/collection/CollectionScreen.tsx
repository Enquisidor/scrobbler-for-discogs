import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import type { DiscogsRelease, QueueItem, Settings, CombinedMetadata } from '../../libs';
import { AlbumCard } from './AlbumCard';
import { STRINGS } from '../../strings';

interface CollectionScreenProps {
  collection: DiscogsRelease[];
  queue: QueueItem[];
  isLoading: boolean;
  isSyncing: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  isFiltered: boolean;
  onAddAlbumToQueue: (release: DiscogsRelease) => void;
  onRemoveLastInstanceOfAlbumFromQueue: (releaseId: number) => void;
  onRemoveAllInstancesOfAlbumFromQueue: (releaseId: number) => void;
  onConnectDiscogs: () => void;
  isConnectingDiscogs: boolean;
  settings: Settings;
  metadata: Record<number, CombinedMetadata>;
  numColumns?: number;
  testID?: string;
}

export const CollectionScreen: React.FC<CollectionScreenProps> = ({
  collection,
  queue,
  isLoading,
  isSyncing,
  hasMore,
  onLoadMore,
  onRefresh,
  isFiltered,
  onAddAlbumToQueue,
  onRemoveLastInstanceOfAlbumFromQueue,
  onRemoveAllInstancesOfAlbumFromQueue,
  onConnectDiscogs,
  isConnectingDiscogs,
  settings,
  metadata,
  numColumns = 3,
  testID,
}) => {
  const { width } = useWindowDimensions();
  const isDiscogsConnected = collection.length > 0 || isSyncing || isLoading;

  // Calculate item dimensions
  const gap = 8;
  const padding = 16;
  const itemWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  // Count albums in queue
  const queueCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const item of queue) {
      counts.set(item.id, (counts.get(item.id) || 0) + 1);
    }
    return counts;
  }, [queue]);

  const renderItem = useCallback(
    ({ item: release }: { item: DiscogsRelease }) => (
      <View style={{ width: itemWidth, marginBottom: gap }}>
        <AlbumCard
          testID={testID ? `${testID}-album-${release.id}` : undefined}
          release={release}
          scrobbleCount={queueCounts.get(release.id) || 0}
          onAddInstance={() => onAddAlbumToQueue(release)}
          onRemoveLastInstance={() => onRemoveLastInstanceOfAlbumFromQueue(release.id)}
          onRemoveAllInstances={() => onRemoveAllInstancesOfAlbumFromQueue(release.id)}
          settings={settings}
          metadata={metadata[release.id]}
        />
      </View>
    ),
    [
      itemWidth,
      gap,
      queueCounts,
      onAddAlbumToQueue,
      onRemoveLastInstanceOfAlbumFromQueue,
      onRemoveAllInstancesOfAlbumFromQueue,
      settings,
      metadata,
      testID,
    ]
  );

  const keyExtractor = useCallback(
    (item: DiscogsRelease) => item.instance_id.toString(),
    []
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }, [hasMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {isFiltered
            ? STRINGS.EMPTY_STATES.NO_FILTERED_ALBUMS
            : STRINGS.EMPTY_STATES.EMPTY_COLLECTION}
        </Text>
      </View>
    );
  }, [isLoading, isFiltered]);

  // Not connected state
  if (!isDiscogsConnected) {
    return (
      <View style={styles.notConnectedContainer} testID={testID}>
        <Text style={styles.notConnectedTitle}>{STRINGS.HEADERS.VIEW_COLLECTION}</Text>
        <Text style={styles.notConnectedText}>
          {STRINGS.STATUS.CONNECT_COLLECTION_INFO}
        </Text>
        <Pressable
          style={[styles.connectButton, isConnectingDiscogs && styles.connectButtonDisabled]}
          onPress={onConnectDiscogs}
          disabled={isConnectingDiscogs}
          testID={testID ? `${testID}-connect-button` : undefined}
        >
          {isConnectingDiscogs ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.connectButtonText}>{STRINGS.BUTTONS.CONNECT_DISCOGS}</Text>
          )}
        </Pressable>
      </View>
    );
  }

  // Loading state
  if (isLoading && collection.length === 0) {
    return (
      <View style={styles.loadingContainer} testID={testID}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{STRINGS.STATUS.LOADING_COLLECTION}</Text>
      </View>
    );
  }

  return (
    <FlatList
      testID={testID}
      data={collection}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={numColumns} // Force re-render when columns change
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={numColumns > 1 ? { gap } : undefined}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isSyncing}
          onRefresh={onRefresh}
          tintColor="#3b82f6"
          colors={['#3b82f6']}
        />
      }
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={12}
      getItemLayout={(_, index) => ({
        length: itemWidth + gap,
        offset: (itemWidth + gap) * Math.floor(index / numColumns),
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    minHeight: '100%',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#d1d5db',
    fontSize: 16,
    marginTop: 16,
  },
  notConnectedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notConnectedTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notConnectedText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  connectButton: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CollectionScreen;
