import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HomeStackParamList } from '../types/navigation';
import { BlockButton } from '../components/BlockButton';
import { ReportForm } from '../components/ReportForm';

type UserProfileScreenProps = NativeStackScreenProps<HomeStackParamList, 'UserProfile'>;

interface UserProfileData {
  id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  activity_tags: string[] | null;
  neighbourhood: string | null;
  is_on: boolean;
}

export default function UserProfileScreen({ route, navigation }: UserProfileScreenProps) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'declined'>('none');
  const [showReportForm, setShowReportForm] = useState(false);

  const checkConnectionStatus = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Check if there's an existing connection between current user and target user
      // Check both directions: currentUser -> targetUser and targetUser -> currentUser
      const { data: connection1 } = await supabase
        .from('connections')
        .select('status, requester_id')
        .eq('requester_id', currentUser.id)
        .eq('target_id', userId)
        .eq('connection_type', '1on1')
        .maybeSingle();

      const { data: connection2 } = await supabase
        .from('connections')
        .select('status, requester_id')
        .eq('requester_id', userId)
        .eq('target_id', currentUser.id)
        .eq('connection_type', '1on1')
        .maybeSingle();

      const connection = connection1 || connection2;

      if (connection) {
        const direction = connection.requester_id === currentUser.id ? 'sent' : 'received';
        console.log('[UserProfile] Connection status:', connection.status, 'direction:', direction);
        setConnectionStatus(connection.status as 'pending' | 'accepted' | 'declined');
      } else {
        console.log('[UserProfile] No connection found');
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  }, [currentUser?.id, userId]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, photo_url, bio, activity_tags, neighbourhood, is_on')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // Check connection status when user or profile changes
  useEffect(() => {
    if (currentUser && userId) {
      checkConnectionStatus();
    }
  }, [currentUser?.id, userId, checkConnectionStatus]);

  // Refresh connection status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        checkConnectionStatus();
      }
    }, [checkConnectionStatus])
  );

  const handleSendRequest = async () => {
    if (!currentUser || !profile) return;

    if (connectionStatus !== 'none') {
      Alert.alert(
        'Already Connected',
        connectionStatus === 'pending'
          ? 'You already have a pending request with this user.'
          : `You already have a ${connectionStatus} connection with this user.`
      );
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          requester_id: currentUser.id,
          target_id: userId,
          connection_type: '1on1',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[UserProfile] Request sent successfully:', data);
      
      // Refresh connection status to show updated state
      await checkConnectionStatus();
      
      Alert.alert(
        'Connection Request Sent! 👋',
        'They\'ll be notified and can accept your request.'
      );
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      
      if (error.code === '23505') {
        // Unique constraint violation - connection already exists
        Alert.alert('Already Connected', 'You already have a connection request with this user.');
        await checkConnectionStatus();
      } else {
        Alert.alert('Error', 'Failed to send connection request. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          {profile.photo_url ? (
            <Image 
              source={{ uri: profile.photo_url }} 
              style={styles.profilePhoto}
              onError={(error) => {
                console.error('Error loading profile photo:', error);
              }}
            />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Text style={styles.profilePhotoPlaceholderText}>
                {profile.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {profile.is_on && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>ON</Text>
            </View>
          )}
        </View>

        {/* Name and Location */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{profile.full_name}</Text>
          {profile.neighbourhood && (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{profile.neighbourhood}</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Activity Tags */}
        {profile.activity_tags && profile.activity_tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INTERESTS</Text>
            <View style={styles.tagsContainer}>
              {profile.activity_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Send Request Button */}
        <View style={styles.actionSection}>
          {connectionStatus === 'none' ? (
            <TouchableOpacity
              style={[styles.sendRequestButton, saving && styles.buttonDisabled]}
              onPress={handleSendRequest}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.sendRequestButtonText}>Send Request</Text>
              )}
            </TouchableOpacity>
          ) : connectionStatus === 'pending' ? (
            <View style={styles.statusButton}>
              <Text style={styles.statusButtonText}>✓ Request Sent</Text>
              <Text style={styles.statusSubtext}>Waiting for response...</Text>
            </View>
          ) : connectionStatus === 'accepted' ? (
            <View style={styles.statusButton}>
              <Text style={styles.statusButtonText}>✓ Connected</Text>
            </View>
          ) : (
            <View style={[styles.statusButton, styles.declinedButton]}>
              <Text style={[styles.statusButtonText, styles.declinedButtonText]}>
                Request Declined
              </Text>
            </View>
          )}
        </View>

        {/* Safety Actions */}
        <View style={styles.safetySection}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReportForm(true)}
          >
            <Text style={styles.reportButtonText}>Report User</Text>
          </TouchableOpacity>
          <BlockButton
            userId={userId}
            userName={profile.full_name}
            onBlocked={() => navigation.goBack()}
            variant="danger"
          />
        </View>

        {/* Report Form Modal */}
        <ReportForm
          visible={showReportForm}
          userId={userId}
          userName={profile.full_name}
          onClose={() => setShowReportForm(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e5e7eb',
  },
  profilePhotoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhotoPlaceholderText: {
    fontSize: 60,
    fontWeight: '700',
    color: '#ffffff',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  tagText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  sendRequestButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  sendRequestButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  statusButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSubtext: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  declinedButton: {
    borderColor: '#ef4444',
  },
  declinedButtonText: {
    color: '#ef4444',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  safetySection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 8,
    gap: 12,
  },
  reportButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  reportButtonText: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '600',
  },
});

