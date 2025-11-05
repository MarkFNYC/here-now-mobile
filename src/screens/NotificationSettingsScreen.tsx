import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NotificationSettings {
  requests: boolean;
  joins: boolean;
  messages: boolean;
  reset: boolean;
  meetups: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  requests: true,
  joins: true,
  messages: true,
  reset: true,
  meetups: true,
};

export default function NotificationSettingsScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{ key: keyof NotificationSettings; value: boolean } | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only load settings when user ID actually changes, not on every user update
    if (user && user.id !== lastUserIdRef.current) {
      lastUserIdRef.current = user.id;
      loadSettings();
    }
  }, [user?.id]); // Only reload when user ID changes, not on every user update

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load settings from user's notification_settings JSONB field
      const userSettings = user.notification_settings as any;

      if (userSettings) {
        // Coerce all values to booleans (JSONB might return strings)
        const coercedSettings: NotificationSettings = {
          requests: Boolean(userSettings.requests ?? DEFAULT_SETTINGS.requests),
          joins: Boolean(userSettings.joins ?? DEFAULT_SETTINGS.joins),
          messages: Boolean(userSettings.messages ?? DEFAULT_SETTINGS.messages),
          reset: Boolean(userSettings.reset ?? DEFAULT_SETTINGS.reset),
          meetups: Boolean(userSettings.meetups ?? DEFAULT_SETTINGS.meetups),
        };
        setSettings(coercedSettings);
      } else {
        // No settings found, use defaults
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    // Ensure value is a proper boolean
    const boolValue = Boolean(value);

    // Warn before disabling critical notifications
    if (!boolValue && (key === 'requests' || key === 'messages')) {
      // Store the pending toggle for this specific key
      setPendingToggle({ key, value: boolValue });

      Alert.alert(
        'Disable Notifications?',
        `You'll miss important ${key === 'requests' ? 'connection requests' : 'messages'} if you disable this. Are you sure?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              // Clear pending toggle - this will revert the switch to current settings
              setPendingToggle(null);
            },
          },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              // Clear pending toggle first, then update
              setPendingToggle(null);
              updateSetting(key, boolValue);
            },
          },
        ]
      );
      // Return early - don't update state yet
      return;
    }

    // For non-critical notifications or enabling (turning ON), clear any pending toggle and update immediately
    if (pendingToggle?.key === key) {
      setPendingToggle(null);
    }
    updateSetting(key, boolValue);
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!user) return;

    // Ensure value is a proper boolean
    const boolValue = Boolean(value);

    const previousSettings = { ...settings };
    const newSettings = {
      ...settings,
      [key]: boolValue,
    };

    // Optimistic update
    setSettings(newSettings);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_settings: newSettings })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving notification settings:', error);
        // Revert on error
        setSettings(previousSettings);
        Alert.alert(
          'Error',
          'Failed to save notification settings. Please try again.'
        );
        return;
      }

      // Settings are saved - trust the optimistic update
      // Don't call refreshUser() as it might load stale data from cache
      // The settings are persisted and will be correct on next app load
      console.log('Notification settings saved successfully:', newSettings);
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      // Revert to previous settings
      setSettings(previousSettings);
      Alert.alert(
        'Error',
        'Failed to save notification settings. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Choose which notifications you want to receive
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Connection Requests</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone wants to connect with you
              </Text>
            </View>
            <Switch
              value={pendingToggle?.key === 'requests' ? pendingToggle.value : settings.requests}
              onValueChange={(value) => handleToggle('requests', value)}
              trackColor={{ false: '#d1d5db', true: '#6ee7b7' }}
              thumbColor={(pendingToggle?.key === 'requests' ? pendingToggle.value : settings.requests) ? '#10b981' : '#f4f4f5'}
              disabled={saving}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Activity Joins</Text>
              <Text style={styles.settingDescription}>
                Notify when someone joins your activity
              </Text>
            </View>
            <Switch
              value={settings.joins}
              onValueChange={(value) => handleToggle('joins', value)}
              trackColor={{ false: '#d1d5db', true: '#6ee7b7' }}
              thumbColor={settings.joins ? '#10b981' : '#f4f4f5'}
              disabled={saving}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>New Messages</Text>
              <Text style={styles.settingDescription}>
                Get notified about new messages in your conversations
              </Text>
            </View>
            <Switch
              value={pendingToggle?.key === 'messages' ? pendingToggle.value : settings.messages}
              onValueChange={(value) => handleToggle('messages', value)}
              trackColor={{ false: '#d1d5db', true: '#6ee7b7' }}
              thumbColor={(pendingToggle?.key === 'messages' ? pendingToggle.value : settings.messages) ? '#10b981' : '#f4f4f5'}
              disabled={saving}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Daily Reset Reminder</Text>
              <Text style={styles.settingDescription}>
                Reminder to toggle ON and be visible today
              </Text>
            </View>
            <Switch
              value={settings.reset}
              onValueChange={(value) => handleToggle('reset', value)}
              trackColor={{ false: '#d1d5db', true: '#6ee7b7' }}
              thumbColor={settings.reset ? '#10b981' : '#f4f4f5'}
              disabled={saving}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Meetup Reminders</Text>
              <Text style={styles.settingDescription}>
                Get reminders about upcoming meetups
              </Text>
            </View>
            <Switch
              value={settings.meetups}
              onValueChange={(value) => handleToggle('meetups', value)}
              trackColor={{ false: '#d1d5db', true: '#6ee7b7' }}
              thumbColor={settings.meetups ? '#10b981' : '#f4f4f5'}
              disabled={saving}
            />
          </View>
        </View>

        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Notification settings are saved automatically. Changes apply immediately.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    paddingVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginLeft: 20,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoBox: {
    backgroundColor: '#dcfce7',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  infoText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
});

