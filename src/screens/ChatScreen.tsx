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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChatsStackParamList } from '../navigation/ChatsStackNavigator';
import type { Message } from '../types/database';
import { LocationPicker } from '../components/LocationPicker';
import { LocationMessageCard } from '../components/LocationMessageCard';

type ChatScreenProps = NativeStackScreenProps<ChatsStackParamList, 'Chat'>;

interface ChatUser {
  id: string;
  full_name: string;
  photo_url: string | null;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { connectionId, userId: otherUserId } = route.params;
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);

  // Load connection details and other user info
  useEffect(() => {
    loadConnectionAndUser();
  }, [connectionId, otherUserId]);

  // Load messages
  useEffect(() => {
    if (connectionId) {
      loadMessages();
    }
  }, [connectionId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!connectionId || !currentUser) return;

    // Create channel for this connection
    const channel = supabase
      .channel(`messages:${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          console.log('[Chat] New message received:', payload.new);
          // Add new message to list
          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some((msg) => msg.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
          // Auto-scroll to bottom after a short delay
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, currentUser]);

  const loadConnectionAndUser = async () => {
    try {
      // Load connection details
      const { data: connData, error: connError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connError) throw connError;
      setConnection(connData);

      // Load other user info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, photo_url')
        .eq('id', otherUserId)
        .single();

      if (userError) throw userError;
      setOtherUser(userData);

      // Set navigation title
      navigation.setOptions({
        title: userData?.full_name || 'Chat',
      });
    } catch (error: any) {
      console.error('Error loading connection/user:', error);
      Alert.alert('Error', 'Failed to load chat');
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Auto-scroll to bottom after loading
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !currentUser || sending) return;

    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          connection_id: connectionId,
          sender_id: currentUser.id,
          content: content,
          is_system_message: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Message will be added via real-time subscription, but add optimistically
      setMessages((prev) => [...prev, data as Message]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessageText(content); // Restore message text on error
    } finally {
      setSending(false);
    }
  };

  const sendLocationProposal = async (locationData: any) => {
    if (!currentUser || sending) return;

    setSending(true);

    try {
      // Store location data as JSON string in content
      const content = JSON.stringify(locationData);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          connection_id: connectionId,
          sender_id: currentUser.id,
          content: content,
          is_system_message: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Message will be added via real-time subscription, but add optimistically
      setMessages((prev) => [...prev, data as Message]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending location proposal:', error);
      Alert.alert('Error', 'Failed to send location proposal. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Parse message content to detect location proposals
  const parseMessageContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'location') {
        return parsed;
      }
    } catch (e) {
      // Not JSON, treat as regular text
    }
    return null;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            messages.map((message) => {
              const isMe = message.sender_id === currentUser?.id;
              const isSystem = message.is_system_message;

              if (isSystem) {
                return (
                  <View key={message.id} style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{message.content}</Text>
                  </View>
                );
              }

              // Check if message is a location proposal
              const locationData = parseMessageContent(message.content);

              if (locationData) {
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageContainer,
                      isMe ? styles.myMessageContainer : styles.otherMessageContainer,
                    ]}
                  >
                    {!isMe && otherUser?.photo_url && (
                      <Image
                        source={{ uri: otherUser.photo_url }}
                        style={styles.avatar}
                      />
                    )}
                    {!isMe && !otherUser?.photo_url && (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {otherUser?.full_name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <LocationMessageCard
                      locationData={locationData}
                      isMe={isMe}
                      onAccept={() => {
                        // TODO: Implement accept location functionality (Story 29)
                        Alert.alert('Location Accepted', 'You can now confirm this meetup.');
                      }}
                      onProposeAlternative={() => {
                        setShowLocationPicker(true);
                      }}
                    />
                  </View>
                );
              }

              // Regular text message
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    isMe ? styles.myMessageContainer : styles.otherMessageContainer,
                  ]}
                >
                  {!isMe && otherUser?.photo_url && (
                    <Image
                      source={{ uri: otherUser.photo_url }}
                      style={styles.avatar}
                    />
                  )}
                  {!isMe && !otherUser?.photo_url && (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {otherUser?.full_name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.myMessageBubble : styles.otherMessageBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.myMessageText : styles.otherMessageText,
                      ]}
                    >
                      {message.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isMe ? styles.myMessageTime : styles.otherMessageTime,
                      ]}
                    >
                      {formatTime(message.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Action Buttons Above Input */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.suggestLocationButton}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.suggestLocationIcon}>📍</Text>
            <Text style={styles.suggestLocationText}>Suggest Location</Text>
          </TouchableOpacity>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Location Picker Modal */}
        <LocationPicker
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onSelect={sendLocationProposal}
        />
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#10b981',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#9ca3af',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionButtonsContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  suggestLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },
  suggestLocationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  suggestLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 40,
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
