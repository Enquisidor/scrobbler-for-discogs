import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import type { Credentials } from '@libs';
import { STRINGS } from '@libs';
import { DiscogsIcon, LastfmIcon, CheckIcon, RefreshIcon, SettingsIcon } from '../misc/Icons';

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
            isDiscogsConnected ? styles.connectedButton : styles.discogsButton,
          ]}
          onPress={isDiscogsConnected ? onDiscogsLogout : handleDiscogsConnect}
          disabled={!!loadingService}
        >
          {loadingService === 'discogs' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <DiscogsIcon size={20} fill="#fff" />
              {isDiscogsConnected && <CheckIcon size={16} color="#4ade80" />}
              <Text style={styles.buttonText}>
                {isDiscogsConnected ? credentials.discogsUsername : STRINGS.BUTTONS.DISCOGS}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Refresh Button */}
        {isDiscogsConnected && (
          <Pressable
            style={[styles.iconButton, (isSyncing || isCollectionLoading) && styles.iconButtonDisabled]}
            onPress={handleForceReload}
            disabled={isSyncing || isCollectionLoading}
          >
            <RefreshIcon size={24} color="#b3b3b3" />
          </Pressable>
        )}

        {/* Last.fm Button */}
        <Pressable
          style={[
            styles.connectionButton,
            isLastfmConnected ? styles.connectedButton : styles.lastfmButton,
          ]}
          onPress={isLastfmConnected ? onLastfmLogout : handleLastfmConnect}
          disabled={!!loadingService}
        >
          {loadingService === 'lastfm' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <LastfmIcon size={20} fill="#fff" />
              {isLastfmConnected && <CheckIcon size={16} color="#4ade80" />}
              <Text style={styles.buttonText}>
                {isLastfmConnected ? credentials.lastfmUsername : STRINGS.BUTTONS.LASTFM}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Settings Button */}
        <Pressable style={styles.iconButton} onPress={onSettingsOpen}>
          <SettingsIcon size={24} color="#b3b3b3" />
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
    color: '#ffffff',
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
    backgroundColor: '#282828', // gray-700
  },
  discogsButton: {
    backgroundColor: '#333333', // brand-discogs
  },
  lastfmButton: {
    backgroundColor: '#d51007', // brand-lastfm
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#282828', // gray-700
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
});
