import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { QueueItem as QueueItemType, Settings, CombinedMetadata } from '@libs';
import { QueueItem } from './QueueItem';

interface QueueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'queue' | 'history';
  queue: QueueItemType[];
  scrobbledHistory: QueueItemType[];
  settings: Settings;
  isLastfmConnected: boolean;
  // Optional props for full functionality (to be wired up later)
  metadata?: Record<number, CombinedMetadata>;
  selectedTrackKeys?: Map<string, Set<string>>;
  onRemoveItem?: (instanceKey: string) => void;
  onScrobbleItem?: (instanceKey: string) => void;
  onScrobbleAll?: () => void;
  onClearQueue?: () => void;
  isScrobbling?: boolean;
  testID?: string;
}

export const QueueSheet: React.FC<QueueSheetProps> = ({
  isOpen,
  onClose,
  view,
  queue,
  scrobbledHistory,
  settings,
  isLastfmConnected,
  metadata = {},
  selectedTrackKeys = new Map(),
  onRemoveItem = () => {},
  onScrobbleItem = () => {},
  onScrobbleAll = () => {},
  onClearQueue = () => {},
  isScrobbling = false,
  testID,
}) => {
  const totalSelectedTracks = Array.from(selectedTrackKeys.values())
    .reduce((sum, keys) => sum + keys.size, 0);

  const hasQueueItems = queue.length > 0;
  const hasHistory = scrobbledHistory.length > 0;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} testID={testID} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{view === 'history' ? 'History' : 'Queue'}</Text>
          <Pressable
            testID={testID ? `${testID}-close` : undefined}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>

        {/* Actions Bar */}
        {hasQueueItems && (
          <View style={styles.actionsBar}>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {queue.length} album{queue.length !== 1 ? 's' : ''} • {totalSelectedTracks} track{totalSelectedTracks !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <Pressable
                testID={testID ? `${testID}-clear` : undefined}
                style={styles.clearButton}
                onPress={onClearQueue}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
              <Pressable
                testID={testID ? `${testID}-scrobble-all` : undefined}
                style={[styles.scrobbleAllButton, (isScrobbling || !isLastfmConnected) && styles.buttonDisabled]}
                onPress={onScrobbleAll}
                disabled={isScrobbling || totalSelectedTracks === 0 || !isLastfmConnected}
              >
                <Text style={styles.scrobbleAllButtonText}>
                  {isLastfmConnected ? 'Scrobble All' : 'Connect Last.fm'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Empty State */}
          {!hasQueueItems && !hasHistory && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Your queue is empty</Text>
              <Text style={styles.emptyText}>
                Tap albums in your collection to add them to the queue for scrobbling.
              </Text>
            </View>
          )}

          {/* Queue Items */}
          {hasQueueItems && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ready to Scrobble</Text>
              {queue.map((item) => {
                const instanceKey = `${item.id}-${item.instance_id}`;
                return (
                  <QueueItem
                    key={instanceKey}
                    testID={testID ? `${testID}-item-${item.id}` : undefined}
                    item={item}
                    selectedTrackKeys={selectedTrackKeys.get(instanceKey) || new Set()}
                    settings={settings}
                    metadata={metadata[item.id]}
                    onRemove={() => onRemoveItem(instanceKey)}
                    onScrobble={() => onScrobbleItem(instanceKey)}
                    isScrobbling={isScrobbling}
                    isHistoryItem={false}
                  />
                );
              })}
            </View>
          )}

          {/* History */}
          {hasHistory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recently Scrobbled</Text>
              {scrobbledHistory.map((item, index) => {
                const instanceKey = `history-${item.id}-${index}`;
                return (
                  <QueueItem
                    key={instanceKey}
                    testID={testID ? `${testID}-history-${item.id}` : undefined}
                    item={item}
                    selectedTrackKeys={new Set()}
                    settings={settings}
                    metadata={metadata[item.id]}
                    onRemove={() => { }}
                    onScrobble={() => { }}
                    isScrobbling={false}
                    isHistoryItem={true}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
  },
  statsContainer: {
    flex: 1,
  },
  statsText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#374151',
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrobbleAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#22c55e',
    borderRadius: 20,
  },
  scrobbleAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
});

export default QueueSheet;
