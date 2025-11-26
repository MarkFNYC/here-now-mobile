import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ActivitiesStackParamList } from '../types/navigation';
import type { Message } from '../types/database';

type ActivityChatScreenProps = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityChat'>;

interface ChatMessage extends Message {
  sender_name: string;
  sender_photo_url: string | null;
  connection_id: string;
}

interface Participant {
  id: string;
  connection_id: string;
  full_name: string;
  photo_url: string | null;
}

export default function ActivityChatScreen({ route, navigation }: ActivityChatScreenProps) {
  const { activityId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [canChat, setCanChat] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);

  // Load activity and participants, check if user can chat
  const loadActivityAndParticipants = useCallback(async () => {
    if (!activityId || !user?.id) return;

    try {
      // Load activity to check if user is host
      const { data: activity } = await supabase
        .from('activities')
        .select('host_id')
        .eq('id', activityId)
        .single();

      const isHost = activity?.host_id === user.id;

      const { data, error } = await supabase
        .from('connections')
        .select(
          `
          id,
          requester_id,
          requester:users!connections_requester_id_fkey (
            id,
            full_name,
            photo_url
          )
        `
        )
        .eq('activity_id', activityId)
        .eq('connection_type', 'pile_on')
        .eq('status', 'accepted');

      if (error) throw error;

      const participantsList: Participant[] =
        data?.map((conn: any) => ({
          id: conn.requester.id,
          connection_id: conn.id,
          full_name: conn.requester.full_name,
          photo_url: conn.requester.photo_url,
        })) || [];

      setParticipants(participantsList);

      // Check if current user is an accepted participant or host
      const userParticipant = participantsList.find((p) => p.id === user.id);
      setCanChat(!!userParticipant || isHost);
    } catch (error: any) {
      console.error('Error loading participants:', error);
    }
  }, [activityId, user?.id]);

  // Load messages from all accepted connections for this activity
  const loadMessages = useCallback(async () => {
    if (!activityId) return;

    try {
      // Get all accepted connection IDs for this activity
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('id, requester_id')
        .eq('activity_id', activityId)
        .eq('connection_type', 'pile_on')
        .eq('status', 'accepted');

      if (connectionsError) throw connectionsError;

      if (!connections || connections.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const connectionIds = connections.map((c) => c.id);

      // Get all messages from these connections
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(
          `
          *,
          connection:connections!messages_connection_id_fkey (
            requester_id
          ),
          sender:users!messages_sender_id_fkey (
            id,
            full_name,
            photo_url
          )
        `
        )
        .in('connection_id', connectionIds)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const chatMessages: ChatMessage[] =
        messagesData?.map((msg: any) => ({
          ...msg,
          sender_name: msg.sender?.full_name || 'Unknown',
          sender_photo_url: msg.sender?.photo_url || null,
          connection_id: msg.connection_id,
        })) || [];

      setMessages(chatMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  const loadData = useCallback(async () => {
    await Promise.all([loadActivityAndParticipants(), loadMessages()]);
  }, [loadActivityAndParticipants, loadMessages]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!activityId) return;

    let isMounted = true;

    // Get all accepted connection IDs and set up subscriptions
    const setupSubscription = async () => {
      const { data: connections } = await supabase
        .from('connections')
        .select('id')
        .eq('activity_id', activityId)
        .eq('connection_type', 'pile_on')
        .eq('status', 'accepted');

      if (!connections || connections.length === 0 || !isMounted) return;

      // Subscribe to messages for each connection
      // We'll subscribe to all connections and filter in the handler
      const channel = supabase
        .channel(`activity:${activityId}:chat`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            if (!isMounted) return;

            const newMessage = payload.new as any;
            const connectionIds = connections.map((c) => c.id);

            // Only process if message is from one of our connections
            if (!connectionIds.includes(newMessage.connection_id)) return;

            // Load the new message with sender info
            const { data: fullMessage, error } = await supabase
              .from('messages')
              .select(
                `
                *,
                connection:connections!messages_connection_id_fkey (
                  requester_id
                ),
                sender:users!messages_sender_id_fkey (
                  id,
                  full_name,
                  photo_url
                )
              `
              )
              .eq('id', newMessage.id)
              .single();

            if (!error && fullMessage) {
              const chatMessage: ChatMessage = {
                ...fullMessage,
                sender_name: fullMessage.sender?.full_name || 'Unknown',
                sender_photo_url: fullMessage.sender?.photo_url || null,
                connection_id: fullMessage.connection_id,
              };

              setMessages((prev) => {
                // Avoid duplicates
                if (prev.find((m) => m.id === chatMessage.id)) return prev;
                return [...prev, chatMessage];
              });

              // Scroll to bottom
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [activityId]);

  // Find user's connection ID for sending messages
  // For hosts, we'll use the first accepted connection (they don't have their own)
  const getUserConnectionId = useCallback(async (): Promise<string | null> => {
    if (!user?.id || !activityId) return null;

    // Check if user is host
    const { data: activity } = await supabase
      .from('activities')
      .select('host_id')
      .eq('id', activityId)
      .single();

    if (activity?.host_id === user.id) {
      // Host uses the first accepted connection for sending messages
      const { data: firstConnection } = await supabase
        .from('connections')
        .select('id')
        .eq('activity_id', activityId)
        .eq('connection_type', 'pile_on')
        .eq('status', 'accepted')
        .limit(1)
        .single();

      return firstConnection?.id || null;
    }

    // Regular participant uses their own connection
    const { data } = await supabase
      .from('connections')
      .select('id')
      .eq('activity_id', activityId)
      .eq('requester_id', user.id)
      .eq('connection_type', 'pile_on')
      .eq('status', 'accepted')
      .single();

    return data?.id || null;
  }, [user?.id, activityId]);

  const sendMessage = async () => {
    if (!messageText.trim() || !user?.id || sending) return;

    const connectionId = await getUserConnectionId();
    if (!connectionId) {
      console.error('User connection not found');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: messageText.trim(),
        is_system_message: false,
      });

      if (error) throw error;

      setMessageText('');
      // Message will appear via real-time subscription
    } catch (error: any) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isCurrentUser = (senderId: string) => senderId === user?.id;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Chat</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  if (!canChat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Chat</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You must be an accepted participant to chat</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            messages.map((message) => {
              const isSystem = message.is_system_message;
              const isUser = isCurrentUser(message.sender_id);

              if (isSystem) {
                return (
                  <View key={message.id} style={styles.systemMessage}>
                    <Text style={styles.systemMessageText}>{message.content}</Text>
                  </View>
                );
              }

              return (
                <View
                  key={message.id}
                  style={[styles.messageRow, isUser && styles.messageRowRight]}
                >
                  {!isUser && (
                    <Image
                      source={
                        message.sender_photo_url
                          ? { uri: message.sender_photo_url }
                          : require('../../assets/icon.png')
                      }
                      style={styles.avatar}
                    />
                  )}
                  <View style={[styles.messageBubble, isUser && styles.messageBubbleRight]}>
                    {!isUser && (
                      <Text style={styles.senderName}>{message.sender_name}</Text>
                    )}
                    <Text style={[styles.messageText, isUser && styles.messageTextRight]}>
                      {message.content}
                    </Text>
                    <Text style={[styles.messageTime, isUser && styles.messageTimeRight]}>
                      {formatTime(message.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  flex: {
    flex: 1,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowRight: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageBubbleRight: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
  },
  messageTextRight: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  messageTimeRight: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

