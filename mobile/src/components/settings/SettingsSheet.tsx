import React from 'react';
import { Modal, View, Text, Pressable, Switch, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Settings, MetadataSource } from '@libs';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

type BooleanSettingKey = 'selectAllTracksPerRelease' | 'selectSubtracksByDefault' | 'showFeatures' | 'selectFeaturesByDefault';

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const handleToggle = (key: BooleanSettingKey) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSourceChange = (key: 'artistSource' | 'albumSource', value: MetadataSource) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const metadataSources: MetadataSource[] = ['discogs', 'apple', 'musicbrainz'];
  const sourceLabels: Record<MetadataSource, string> = {
    discogs: 'Discogs',
    apple: 'Apple Music',
    musicbrainz: 'MusicBrainz',
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Track Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Track Selection</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Select All Tracks</Text>
                <Text style={styles.settingDescription}>
                  Auto-select all tracks when adding to queue
                </Text>
              </View>
              <Switch
                value={settings.selectAllTracksPerRelease}
                onValueChange={() => handleToggle('selectAllTracksPerRelease')}
                trackColor={{ true: '#2563eb', false: '#374151' }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Select Subtracks</Text>
                <Text style={styles.settingDescription}>
                  Include subtracks by default
                </Text>
              </View>
              <Switch
                value={settings.selectSubtracksByDefault}
                onValueChange={() => handleToggle('selectSubtracksByDefault')}
                trackColor={{ true: '#2563eb', false: '#374151' }}
              />
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Features</Text>
                <Text style={styles.settingDescription}>
                  Display featured artists on tracks
                </Text>
              </View>
              <Switch
                value={settings.showFeatures}
                onValueChange={() => handleToggle('showFeatures')}
                trackColor={{ true: '#2563eb', false: '#374151' }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Select Features</Text>
                <Text style={styles.settingDescription}>
                  Include featured artists by default
                </Text>
              </View>
              <Switch
                value={settings.selectFeaturesByDefault}
                onValueChange={() => handleToggle('selectFeaturesByDefault')}
                trackColor={{ true: '#2563eb', false: '#374151' }}
              />
            </View>
          </View>

          {/* Metadata Sources */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metadata Sources</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Artist Source</Text>
                <Text style={styles.settingDescription}>
                  Preferred source for artist names
                </Text>
              </View>
              <View style={styles.sourceSelector}>
                {metadataSources.map((source) => (
                  <Pressable
                    key={source}
                    style={[
                      styles.sourceOption,
                      settings.artistSource === source && styles.sourceOptionSelected,
                    ]}
                    onPress={() => handleSourceChange('artistSource', source)}
                  >
                    <Text
                      style={[
                        styles.sourceOptionText,
                        settings.artistSource === source && styles.sourceOptionTextSelected,
                      ]}
                    >
                      {sourceLabels[source]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Album Source</Text>
                <Text style={styles.settingDescription}>
                  Preferred source for album names
                </Text>
              </View>
              <View style={styles.sourceSelector}>
                {metadataSources.map((source) => (
                  <Pressable
                    key={source}
                    style={[
                      styles.sourceOption,
                      settings.albumSource === source && styles.sourceOptionSelected,
                    ]}
                    onPress={() => handleSourceChange('albumSource', source)}
                  >
                    <Text
                      style={[
                        styles.sourceOptionText,
                        settings.albumSource === source && styles.sourceOptionTextSelected,
                      ]}
                    >
                      {sourceLabels[source]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeText: {
    fontSize: 16,
    color: '#3b82f6', // blue-500 (matches web)
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sourceSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sourceOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#374151',
  },
  sourceOptionSelected: {
    backgroundColor: '#2563eb', // blue-600 (matches web)
  },
  sourceOptionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sourceOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
