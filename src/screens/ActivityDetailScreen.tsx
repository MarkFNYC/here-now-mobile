import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ActivitiesStackParamList, ActivityDetailScreenNavigationProp } from '../types/navigation';
import { ParticipantsList } from '../components/ParticipantsList';

type ActivityDetailScreenProps = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityDetail'>;

interface Activity {
  id: string;
  title: string;
  description: string | null;
  activity_type: string;
  location_name: string;
  start_time: string;
  end_time: string;
  is_one_on_one: boolean;
  max_participants: number | null;
  host_id: string;
  status: string;
}

interface Participant {
  id: string;
  connection_id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  neighbourhood: string | null;
  status: 'pending' | 'accepted';
  created_at: string;
}

export default function ActivityDetailScreen({ route, navigation }: ActivityDetailScreenProps) {
  const { activityId } = route.params;
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingConnectionId, setProcessingConnectionId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const channelRef = useRef<any>(null);

  const loadActivity = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (error) throw error;
      setActivity(data);
    } catch (error: any) {
      console.error('Error loading activity:', error);
      Alert.alert('Error', 'Failed to load activity details');
    }
  }, [activityId]);

  const loadParticipants = useCallback(async () => {
    if (!activityId) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select(
          `
          id,
          requester_id,
          status,
          created_at,
          requester:users!connections_requester_id_fkey (
            id,
            full_name,
            photo_url,
            bio,
            neighbourhood
          )
        `
        )
        .eq('activity_id', activityId)
        .eq('connection_type', 'pile_on')
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const participantsList: Participant[] =
        data?.map((conn: any) => ({
          id: conn.requester.id,
          connection_id: conn.id,
          full_name: conn.requester.full_name,
          photo_url: conn.requester.photo_url,
          bio: conn.requester.bio,
          neighbourhood: conn.requester.neighbourhood,
          status: conn.status === 'accepted' ? 'accepted' : 'pending',
          created_at: conn.created_at,
        })) || [];

      setParticipants(participantsList);

      // Check if current user has joined
      if (user?.id) {
        const userParticipant = participantsList.find((p) => p.id === user.id);
        setIsJoined(!!userParticipant);
      }
    } catch (error: any) {
      console.error('Error loading participants:', error);
    }
  }, [activityId, user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadActivity(), loadParticipants()]);
    setLoading(false);
  }, [loadActivity, loadParticipants]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Set up real-time subscription for participants
  useEffect(() => {
    if (!activityId) return;

    const channel = supabase
      .channel(`activity:${activityId}:participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `activity_id=eq.${activityId}`,
        },
        () => {
          // Reload participants when connections change
          loadParticipants();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [activityId, loadParticipants]);

  const createSystemMessage = async (connectionId: string, content: string) => {
    try {
      // Get the requester_id from the connection
      const { data: connection } = await supabase
        .from('connections')
        .select('requester_id')
        .eq('id', connectionId)
        .single();

      if (!connection) return;

      await supabase.from('messages').insert({
        connection_id: connectionId,
        sender_id: connection.requester_id,
        content,
        is_system_message: true,
      });
    } catch (error) {
      console.error('Error creating system message:', error);
      // Don't fail the accept/decline if system message fails
    }
  };

  const handleAccept = async (connectionId: string) => {
    if (!user?.id || !activity) return;

    // Check capacity
    const acceptedCount = participants.filter((p) => p.status === 'accepted').length;
    if (activity.max_participants && acceptedCount >= activity.max_participants) {
      Alert.alert('Activity Full', 'This activity has reached its maximum capacity');
      return;
    }

    setProcessingConnectionId(connectionId);
    try {
      // Get participant info before accepting
      const participant = participants.find((p) => p.connection_id === connectionId);
      
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId)
        .eq('target_id', user.id); // Ensure only host can accept

      if (error) throw error;

      // Create system message for all accepted connections
      const { data: acceptedConnections } = await supabase
        .from('connections')
        .select('id')
        .eq('activity_id', activity.id)
        .eq('connection_type', 'pile_on')
        .eq('status', 'accepted');

      if (acceptedConnections && participant) {
        const systemMessage = `${participant.full_name} joined the activity`;
        // Create system message in the new participant's connection
        await createSystemMessage(connectionId, systemMessage);
      }

      await loadParticipants();
      Alert.alert('Success', 'Participant accepted');
    } catch (error: any) {
      console.error('Error accepting participant:', error);
      Alert.alert('Error', 'Failed to accept participant');
    } finally {
      setProcessingConnectionId(null);
    }
  };

  const handleDecline = async (connectionId: string) => {
    if (!user?.id) return;

    setProcessingConnectionId(connectionId);
    try {
      // Get participant info before declining
      const participant = participants.find((p) => p.connection_id === connectionId);

      const { error } = await supabase
        .from('connections')
        .update({ status: 'declined' })
        .eq('id', connectionId)
        .eq('target_id', user.id); // Ensure only host can decline

      if (error) throw error;

      await loadParticipants();
    } catch (error: any) {
      console.error('Error declining participant:', error);
      Alert.alert('Error', 'Failed to decline participant');
    } finally {
      setProcessingConnectionId(null);
    }
  };

  const handleJoin = async () => {
    if (!user?.id || !activity) return;

    // Check if user is the host
    if (activity.host_id === user.id) {
      Alert.alert('Cannot Join', 'You cannot join your own activity');
      return;
    }

    // Check capacity
    const acceptedCount = participants.filter((p) => p.status === 'accepted').length;
    if (activity.max_participants && acceptedCount >= activity.max_participants) {
      Alert.alert('Activity Full', 'This activity has reached its maximum capacity');
      return;
    }

    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          activity_id: activity.id,
          requester_id: user.id,
          target_id: activity.host_id,
          connection_type: 'pile_on',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      await loadParticipants();
      Alert.alert(
        'Join Request Sent!',
        'Waiting for host confirmation. You\'ll be notified when they respond.'
      );
    } catch (error: any) {
      console.error('Error joining activity:', error);
      if (error.code === '23505') {
        Alert.alert('Already Joined', 'You have already requested to join this activity');
      } else {
        Alert.alert('Error', 'Failed to join activity. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleParticipantPress = (participant: Participant) => {
    // Navigate to user profile via the main tab navigator
    const parent = navigation.getParent();
    if (parent) {
      (parent as any).navigate('Home', {
        screen: 'UserProfile',
        params: { userId: participant.id },
      });
    }
  };

  const handleConfirmActivity = async () => {
    if (!user?.id || !activity) return;

    const acceptedConnections = participants.filter((p) => p.status === 'accepted');
    if (acceptedConnections.length === 0) {
      Alert.alert('No Participants', 'You need at least one accepted participant to confirm');
      return;
    }

    Alert.alert(
      'Confirm Activity',
      `This will lock in the final details for ${acceptedConnections.length} participant${acceptedConnections.length === 1 ? '' : 's'}. They will all be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Update activity status to confirmed
              const { error: activityError } = await supabase
                .from('activities')
                .update({ status: 'confirmed' })
                .eq('id', activity.id)
                .eq('host_id', user.id);

              if (activityError) throw activityError;

              // Create system messages in all accepted connections
              const connectionIds = acceptedConnections.map((p) => p.connection_id);
              const confirmationMessage = `Activity confirmed! Meet at ${activity.location_name} from ${formatTime(activity.start_time)} to ${formatTime(activity.end_time)}.`;

              for (const connectionId of connectionIds) {
                await createSystemMessage(connectionId, confirmationMessage);
              }

              // Reload activity to show updated status
              await loadActivity();
              Alert.alert('Success', 'Activity confirmed! All participants have been notified.');
            } catch (error: any) {
              console.error('Error confirming activity:', error);
              Alert.alert('Error', 'Failed to confirm activity. Please try again.');
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const isHost = user?.id === activity?.host_id;
  const userParticipant = participants.find((p) => p.id === user?.id);
  const canAccessChat = userParticipant?.status === 'accepted' || isHost;
  const going = participants.filter((p) => p.status === 'accepted');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Activity not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Activity Info */}
        <View style={styles.activityCard}>
          <Text style={styles.title}>{activity.title}</Text>
          {activity.description && (
            <Text style={styles.description}>{activity.description}</Text>
          )}

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>
                {formatDate(activity.start_time)} • {formatTime(activity.start_time)} -{' '}
                {formatTime(activity.end_time)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{activity.location_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🏷️</Text>
              <Text style={styles.detailText}>{activity.activity_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={styles.detailText}>
                {activity.is_one_on_one ? '1:1 only' : 'Group activity'}
                {activity.max_participants && ` • Max ${activity.max_participants} people`}
              </Text>
            </View>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.participantsSection}>
          <ParticipantsList
            participants={participants}
            isHost={isHost}
            onParticipantPress={handleParticipantPress}
            onAccept={handleAccept}
            onDecline={handleDecline}
            processingConnectionId={processingConnectionId}
          />
        </View>

        {/* Join Button (for non-hosts) */}
        {!isHost && !isJoined && (
          <View style={styles.joinSection}>
            <TouchableOpacity
              style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
              onPress={handleJoin}
              disabled={isJoining}
              activeOpacity={0.8}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Activity</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isJoined && !isHost && (
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>
              {participants.find((p) => p.id === user?.id)?.status === 'pending'
                ? '⏳ Waiting for host confirmation'
                : '✅ You\'re going!'}
            </Text>
          </View>
        )}

        {/* Host Confirmation Button */}
        {isHost && going.length > 0 && activity.status !== 'confirmed' && (
          <View style={styles.confirmSection}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmActivity}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>✅ Confirm Activity Details</Text>
            </TouchableOpacity>
            <Text style={styles.confirmHelperText}>
              Lock in the final details for all {going.length} participant{going.length === 1 ? '' : 's'}
            </Text>
          </View>
        )}

        {/* Confirmed Badge */}
        {activity.status === 'confirmed' && (
          <View style={styles.confirmedBadge}>
            <Text style={styles.confirmedBadgeText}>✅ Activity Confirmed</Text>
          </View>
        )}

        {/* Chat Button (for accepted participants) */}
        {canAccessChat && (
          <View style={styles.chatSection}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => navigation.navigate('ActivityChat', { activityId })}
              activeOpacity={0.8}
            >
              <Text style={styles.chatButtonText}>💬 Open Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 60,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 18,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  participantsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  joinSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  joinButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chatSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chatButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmHelperText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  confirmedBadge: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmedBadgeText: {
    color: '#065f46',
    fontSize: 15,
    fontWeight: '600',
  },
});

