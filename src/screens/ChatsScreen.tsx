import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChatsStackParamList } from '../navigation/ChatsStackNavigator';
import { useNotifications } from '../hooks/useNotifications';

type ChatsScreenProps = NativeStackScreenProps<ChatsStackParamList, 'ChatsList'>;

interface ChatConnection {
  id: string;
  connection_id: string;
  other_user: {
    id: string;
    full_name: string;
    photo_url: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  meet_time: string | null;
  meet_location: string | null;
  is_confirmed: boolean | null;
  status: string | null;
}

export default function ChatsScreen({ navigation }: ChatsScreenProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {
    unreadRequestCount,
    latestRequestNotification,
    markRequestNotificationsAsRead,
  } = useNotifications();

  const loadChats = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch all accepted connections where current user is either requester or target
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('id, requester_id, target_id, meet_time, meet_location, is_confirmed, status')
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
        .eq('connection_type', '1on1')
        .order('updated_at', { ascending: false });

      if (connectionsError) throw connectionsError;

      if (!connections || connections.length === 0) {
        setChats([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get the other user for each connection and the last message
      const chatPromises = connections.map(async (conn) => {
        const otherUserId = conn.requester_id === user.id ? conn.target_id : conn.requester_id;

        // Fetch other user info
        const { data: userData } = await supabase
          .from('users')
          .select('id, full_name, photo_url')
          .eq('id', otherUserId)
          .single();

        // Fetch last message
        const { data: messages } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('connection_id', conn.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: conn.id,
          connection_id: conn.id,
          other_user: userData || {
            id: otherUserId,
            full_name: 'Unknown User',
            photo_url: null,
          },
          last_message: messages || null,
          meet_time: conn.meet_time,
          meet_location: conn.meet_location,
          is_confirmed: conn.is_confirmed,
          status: conn.status,
        };
      });

      const chatData = await Promise.all(chatPromises);
      const filtered = chatData.filter(
        (chat) =>
          chat.last_message !== null ||
          chat.is_confirmed ||
          chat.status === 'cancelled'
      );
      setChats(filtered);
    } catch (error: any) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
      markRequestNotificationsAsRead();
    }, [loadChats, markRequestNotificationsAsRead])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const parseJsonSafe = (value: any) => {
    if (!value) return null;

    if (typeof value === 'object') {
      return value;
    }

    if (typeof value !== 'string') return null;

    const attemptParse = (input: string) => {
      try {
        return JSON.parse(input);
      } catch {
        return null;
      }
    };

    let parsed = attemptParse(value.trim());
    if (parsed) return parsed;

    if (value.startsWith('"') && value.endsWith('"')) {
      const unescaped = value.slice(1, -1).replace(/\\"/g, '"');
      parsed = attemptParse(unescaped);
      if (parsed) return parsed;
    }

    return null;
  };

  const formatPreview = (chat: ChatConnection) => {
    const locationObj = parseJsonSafe(chat.meet_location);
    const locationName =
      locationObj?.name ||
      locationObj?.location_name ||
      (typeof chat.meet_location === 'string' ? chat.meet_location : null);

    if (chat.status === 'cancelled') {
      return `❌ Cancelled${locationName ? ` · ${locationName}` : ''}`;
    }

    if (chat.is_confirmed) {
      try {
        const date = chat.meet_time ? new Date(chat.meet_time) : null;
        const dateString = date
          ? date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
          : null;
        const timeString = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
        return `✅ Confirmed${dateString ? ` · ${dateString}` : ''}${timeString ? ` ${timeString}` : ''}${
          locationName ? ` · ${locationName}` : ''
        }`;
      } catch {
        return '✅ Meetup confirmed';
      }
    }

    if (!chat.last_message) {
      return 'No messages yet';
    }

    const parsed = parseJsonSafe(chat.last_message.content);

    if (parsed?.type === 'location') {
      const acceptedSuffix = parsed.status === 'accepted' ? ' (accepted)' : '';
      return `📍 ${parsed.location_name}${acceptedSuffix}`;
    }

    if (parsed?.type === 'time') {
      const acceptedSuffix = parsed.status === 'accepted' ? ' (accepted)' : '';

      try {
        const date = new Date(parsed.iso_time);
        const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);

        if (!Number.isFinite(diffMinutes)) {
          return `⏰ ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${acceptedSuffix}`;
        }

        if (Math.abs(diffMinutes) < 60) {
          return `⏰ In ${diffMinutes} min${acceptedSuffix}`;
        }

        const diffHours = Math.round(diffMinutes / 60);
        if (Math.abs(diffHours) < 24) {
          return `⏰ In ${diffHours} hr${diffHours === 1 ? '' : 's'}${acceptedSuffix}`;
        }

        return `⏰ ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}${acceptedSuffix}`;
      } catch {
        return `⏰ ${parsed.iso_time}${acceptedSuffix}`;
      }
    }

    return chat.last_message.content;
  };

  const handleChatPress = (chat: ChatConnection) => {
    navigation.navigate('Chat', {
      connectionId: chat.connection_id,
      userId: chat.other_user.id,
    });
  };

  const handleRequestsPress = () => {
    markRequestNotificationsAsRead();
    navigation.navigate('Requests');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>Your conversations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>Your conversations</Text>
        <TouchableOpacity style={styles.requestsButton} onPress={handleRequestsPress}>
          <Text style={styles.requestsButtonText}>View Requests</Text>
          {unreadRequestCount > 0 && (
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsBadgeText}>
                {unreadRequestCount > 9 ? '9+' : unreadRequestCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {latestRequestNotification && !latestRequestNotification.is_read && (
        <TouchableOpacity
          style={styles.notificationBanner}
          onPress={handleRequestsPress}
          activeOpacity={0.9}
        >
          <Text style={styles.notificationBannerTitle}>New connection request</Text>
          <Text style={styles.notificationBannerBody}>{latestRequestNotification.body}</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>
              Connect with neighbors to start conversations
            </Text>
          </View>
        ) : (
          chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatItem}
              onPress={() => handleChatPress(chat)}
              activeOpacity={0.7}
            >
              {chat.other_user.photo_url ? (
                <Image
                  source={{ uri: chat.other_user.photo_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {chat.other_user.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{chat.other_user.full_name}</Text>
                  {chat.last_message && (
                    <Text style={styles.chatTime}>
                      {formatTime(chat.last_message.created_at)}
                    </Text>
                  )}
                </View>
                <Text
                  style={styles.chatPreview}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatPreview(chat)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
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
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  requestsButton: {
    marginTop: 16,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  requestsButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  requestsBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  notificationBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#ecfdf5',
    borderColor: '#34d399',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  notificationBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
  },
  notificationBannerBody: {
    fontSize: 13,
    color: '#065f46',
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
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chatTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chatPreview: {
    fontSize: 14,
    color: '#6b7280',
  },
  chatPreviewEmpty: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
