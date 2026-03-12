import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image, StyleSheet, Modal } from 'react-native';
import type { Credentials } from '@libs';
import { STRINGS, colors, headerStyles, connectionButtonStyles, iconButtonStyles } from '@libs';
import { CheckIcon, RefreshIcon, SettingsIcon } from '../misc/Icons';

const discogsLogo = require('../../../assets/discogs.png') as number;
const lastfmLogo = require('../../../assets/lastfm.png') as number;

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

interface ConnectionButtonProps {
  service: 'discogs' | 'lastfm';
  isConnected: boolean;
  username: string;
  avatarUrl?: string;
  isLoading: boolean;
  isDisabled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  service,
  isConnected,
  username,
  avatarUrl,
  isLoading,
  isDisabled,
  onConnect,
  onDisconnect,
}) => {
  const logo = service === 'discogs' ? discogsLogo : lastfmLogo;

  return (
    <Pressable
      style={[
        styles.connectionButton,
        isConnected ? styles.connectedButton : (service === 'discogs' ? styles.discogsButton : styles.lastfmButton),
      ]}
      onPress={isConnected ? onDisconnect : onConnect}
      disabled={isDisabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <View style={styles.buttonContent}>
          {isConnected && avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          )}
          {isConnected && <CheckIcon size={14} color={colors.success} />}
          <Text style={styles.buttonText} numberOfLines={1}>
            {isConnected ? username : (service === 'discogs' ? STRINGS.BUTTONS.DISCOGS : STRINGS.BUTTONS.LASTFM)}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

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
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);

  return (
    <View style={styles.container}>
      {/* Top row: Title + utility icons */}
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{STRINGS.APP_NAME}</Text>
          {isSyncing && <ActivityIndicator size="small" color={colors.gray[400]} />}
        </View>
        <View style={styles.utilityButtons}>
          {isDiscogsConnected && (
            <Pressable
              style={[styles.iconButton, (isSyncing || isCollectionLoading) && styles.iconButtonDisabled]}
              onPress={() => setShowRefreshConfirm(true)}
              disabled={isSyncing || isCollectionLoading}
            >
              <RefreshIcon size={20} color={colors.gray[400]} />
            </Pressable>
          )}
          <Pressable style={styles.iconButton} onPress={onSettingsOpen}>
            <SettingsIcon size={20} color={colors.gray[400]} />
          </Pressable>
        </View>
      </View>

      {/* Connection buttons */}
      <View style={styles.buttonsRow}>
        <ConnectionButton
          service="discogs"
          isConnected={isDiscogsConnected}
          username={credentials.discogsUsername}
          avatarUrl={credentials.discogsAvatarUrl}
          isLoading={loadingService === 'discogs'}
          isDisabled={!!loadingService}
          onConnect={handleDiscogsConnect}
          onDisconnect={onDiscogsLogout}
        />
        <ConnectionButton
          service="lastfm"
          isConnected={!!credentials.lastfmSessionKey}
          username={credentials.lastfmUsername}
          avatarUrl={credentials.lastfmAvatarUrl}
          isLoading={loadingService === 'lastfm'}
          isDisabled={!!loadingService}
          onConnect={handleLastfmConnect}
          onDisconnect={onLastfmLogout}
        />
      </View>

      {/* Refresh confirmation dialog */}
      <Modal
        visible={showRefreshConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRefreshConfirm(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowRefreshConfirm(false)}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Refresh Collection</Text>
            <Text style={styles.dialogMessage}>
              This fetches the whole collection a-fresh.
            </Text>
            <View style={styles.dialogButtons}>
              <Pressable
                style={[styles.dialogButton, styles.dialogButtonCancel]}
                onPress={() => setShowRefreshConfirm(false)}
              >
                <Text style={styles.dialogButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogButton, styles.dialogButtonConfirm]}
                onPress={() => {
                  setShowRefreshConfirm(false);
                  handleForceReload();
                }}
              >
                <Text style={styles.dialogButtonConfirmText}>Refresh</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...headerStyles.container,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    ...headerStyles.titleRow,
    flex: 1,
    marginBottom: 0,
  },
  title: headerStyles.title,
  utilityButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonsRow: {
    ...headerStyles.buttonsRow,
    flexWrap: 'wrap' as const,
  },
  connectionButton: {
    ...connectionButtonStyles.base,
    flexShrink: 1,
    minWidth: 60,
  },
  connectedButton: connectionButtonStyles.connected,
  discogsButton: connectionButtonStyles.discogs,
  lastfmButton: connectionButtonStyles.lastfm,
  buttonContent: connectionButtonStyles.content,
  buttonText: {
    ...connectionButtonStyles.text,
    flexShrink: 1,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  logo: {
    width: 18,
    height: 18,
  },
  iconButton: {
    ...iconButtonStyles.base,
    width: 32,
    height: 32,
  },
  iconButtonDisabled: iconButtonStyles.disabled,
  // Confirmation dialog
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: colors.gray[800],
    borderRadius: 14,
    padding: 20,
    width: 260,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  dialogTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  dialogMessage: {
    color: colors.gray[400],
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  dialogButtonCancel: {
    backgroundColor: colors.gray[700],
  },
  dialogButtonCancelText: {
    color: colors.gray[300],
    fontSize: 14,
    fontWeight: '500',
  },
  dialogButtonConfirm: {
    backgroundColor: colors.primary,
  },
  dialogButtonConfirmText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
