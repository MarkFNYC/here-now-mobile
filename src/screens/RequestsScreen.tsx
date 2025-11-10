import React, { useState, useEffect, useCallback } from 'react';
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
import { Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { ChatsStackParamList } from '../navigation/ChatsStackNavigator';

type RequestsScreenProps = NativeStackScreenProps<ChatsStackParamList, 'Requests'>;

interface ConnectionRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  created_at: string;
  requester: {
    id: string;
    full_name: string;
    photo_url: string | null;
    bio: string | null;
    activity_tags: string[] | null;
    neighbourhood: string | null;
  };
}

export default function RequestsScreen({ navigation }: RequestsScreenProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user) return;

    try {
      // First get the connection requests
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('id, requester_id, target_id, status, created_at')
        .eq('target_id', user.id)
        .eq('status', 'pending')
        .eq('connection_type', '1on1')
        .order('created_at', { ascending: false });

      if (connectionsError) throw connectionsError;

      if (!connections || connections.length === 0) {
        setRequests([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get unique requester IDs
      const requesterIds = [...new Set(connections.map(c => c.requester_id))];

      // Fetch requester user data
      const { data: requesters, error: requestersError } = await supabase
        .from('users')
        .select('id, full_name, photo_url, bio, activity_tags, neighbourhood')
        .in('id', requesterIds);

      if (requestersError) throw requestersError;

      // Combine the data
      const requesterMap = new Map((requesters || []).map(r => [r.id, r]));
      
      const transformedRequests = connections.map((conn) => ({
        id: conn.id,
        requester_id: conn.requester_id,
        target_id: conn.target_id,
        status: conn.status,
        created_at: conn.created_at,
        requester: requesterMap.get(conn.requester_id) || {
          id: conn.requester_id,
          full_name: 'Unknown User',
          photo_url: null,
          bio: null,
          activity_tags: null,
          neighbourhood: null,
        },
      }));

      setRequests(transformedRequests);
    } catch (error: any) {
      console.error('Error loading connection requests:', error);
      Alert.alert('Error', 'Failed to load connection requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const handleAccept = async (requestId: string, requesterId: string) => {
    if (!user) return;

    setProcessingId(requestId);
    try {
      // Update connection status to accepted
      const { error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('target_id', user.id); // Ensure user can only accept requests sent to them

      if (updateError) throw updateError;

      // Create system message when connection is accepted
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          connection_id: requestId,
          sender_id: user.id, // System messages can use current user as sender
          content: 'Say hi! Coordinate where and when to meet.',
          is_system_message: true,
        });

      if (messageError) {
        console.error('Error creating system message:', messageError);
        // Don't fail the accept if message creation fails
      }

      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));

      // Navigate directly to chat (no alert, as per PRD: "Chat opens automatically on accept")
      navigation?.navigate('Chat', { connectionId: requestId, userId: requesterId });
    } catch (error: any) {
      console.error('Error accepting connection request:', error);
      Alert.alert('Error', 'Failed to accept connection request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string, requesterId: string) => {
    if (!user) return;

    Alert.alert(
      'Decline Connection Request',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(requestId);
            try {
              // Update connection status to declined
              const { error: updateError } = await supabase
                .from('connections')
                .update({ status: 'declined' })
                .eq('id', requestId)
                .eq('target_id', user.id); // Ensure user can only decline requests sent to them

              if (updateError) throw updateError;

              // Send polite auto-message (we'll need to check if messages table exists)
              // For now, we'll just decline the connection
              // TODO: Send auto-message when messages table is properly set up

              // Remove from local state
              setRequests(prev => prev.filter(req => req.id !== requestId));

              Alert.alert('Request Declined', 'The connection request has been declined.');
            } catch (error: any) {
              console.error('Error declining connection request:', error);
              Alert.alert('Error', 'Failed to decline connection request. Please try again.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connection Requests</Text>
        <Text style={styles.subtitle}>
          {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👋</Text>
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptyText}>
              Connection requests from people nearby will appear here
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={() => handleAccept(request.id, request.requester.id)}
              onDecline={() => handleDecline(request.id, request.requester.id)}
              isProcessing={processingId === request.id}
              onViewProfile={(userId) => {
                // Navigate to user profile - we'll need to navigate to Home tab first
                // For now, we'll just show an alert that this feature is coming
                // TODO: Implement proper navigation to UserProfileScreen
              }}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface RequestCardProps {
  request: ConnectionRequest;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing: boolean;
  onViewProfile?: (userId: string) => void;
}

function RequestCard({ request, onAccept, onDecline, isProcessing, onViewProfile }: RequestCardProps) {
  const requester = request.requester;

  return (
    <View style={styles.card}>
      {/* Header with Photo and Name */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => onViewProfile?.(requester.id)}
        activeOpacity={0.7}
      >
        {requester.photo_url ? (
          <Image 
            source={{ uri: requester.photo_url }} 
            style={styles.avatar}
            onError={(error) => {
              console.error('Error loading requester photo:', error);
            }}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {requester.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{requester.full_name}</Text>
          {requester.neighbourhood && (
            <Text style={styles.location}>📍 {requester.neighbourhood}</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Bio */}
      {requester.bio && (
        <Text style={styles.bio}>{requester.bio}</Text>
      )}

      {/* Activity Tags */}
      {requester.activity_tags && requester.activity_tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {requester.activity_tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={onDecline}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Text style={styles.declineButtonText}>Not today</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={onAccept}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept ✓</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#6b7280',
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  tagText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  declineButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

