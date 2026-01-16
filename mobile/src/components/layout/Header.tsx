import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import type { Credentials } from '../../libs';
import { STRINGS } from '../../libs';

interface HeaderProps {
  isSyncing: boolean;
  credentials: Credentials;
  loadingService: 'discogs' | 'lastfm' | null;
  handleDiscogsConnect: () => void;
  onDiscogsLogout: () => void;
  isCollectionLoading: boolean;
  handleForceReload: () => void;
  handleLastfmConnect: () => void;
  onLastfmLogout: () => void;
  onSettingsOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSyncing,
  credentials,
  loadingService,
  handleDiscogsConnect,
  onDiscogsLogout,
  isCollectionLoading,
  handleForceReload,
  handleLastfmConnect,
  onLastfmLogout,
  onSettingsOpen,
}) => {
  const isDiscogsConnected = !!credentials.discogsAccessToken;
  const isLastfmConnected = !!credentials.lastfmSessionKey;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{STRINGS.APP_NAME}</Text>
        {isSyncing && <ActivityIndicator size="small" color="#9CA3AF" />}
      </View>

      <View style={styles.buttonsRow}>
        {/* Discogs Button */}
        <Pressable
          style={[
            styles.connectionButton,
            isDiscogsConnected ? styles.connectedButton : styles.disconnectedButton,
          ]}
          onPress={isDiscogsConnected ? onDiscogsLogout : handleDiscogsConnect}
          disabled={!!loadingService}
        >
          {loadingService === 'discogs' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isDiscogsConnected ? credentials.discogsUsername : STRINGS.BUTTONS.DISCOGS}
            </Text>
          )}
        </Pressable>

        {/* Refresh Button */}
        {isDiscogsConnected && (
          <Pressable
            style={styles.iconButton}
            onPress={handleForceReload}
            disabled={isSyncing || isCollectionLoading}
          >
            <Text style={styles.iconText}>↻</Text>
          </Pressable>
        )}

        {/* Last.fm Button */}
        <Pressable
          style={[
            styles.connectionButton,
            isLastfmConnected ? styles.connectedButton : styles.disconnectedButton,
          ]}
          onPress={isLastfmConnected ? onLastfmLogout : handleLastfmConnect}
          disabled={!!loadingService}
        >
          {loadingService === 'lastfm' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLastfmConnected ? credentials.lastfmUsername : STRINGS.BUTTONS.LASTFM}
            </Text>
          )}
        </Pressable>

        {/* Settings Button */}
        <Pressable style={styles.iconButton} onPress={onSettingsOpen}>
          <Text style={styles.iconText}>⚙</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  connectedButton: {
    backgroundColor: '#1F2937', // gray-800
    borderWidth: 1,
    borderColor: '#374151', // gray-700
  },
  disconnectedButton: {
    backgroundColor: '#374151', // gray-700
  },
  buttonText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '500',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
});
