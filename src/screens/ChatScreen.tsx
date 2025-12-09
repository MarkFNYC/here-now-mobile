import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChatsStackParamList } from '../navigation/ChatsStackNavigator';
import type { Message } from '../types/database';
import { LocationPicker } from '../components/LocationPicker';
import { LocationMessageCard } from '../components/LocationMessageCard';
import { TimePicker } from '../components/TimePicker';
import { TimeMessageCard } from '../components/TimeMessageCard';
import { CancelMeetupModal } from '../components/CancelMeetupModal';
import { BlockButton } from '../components/BlockButton';
import { ReportForm } from '../components/ReportForm';

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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);
  const connectionMeetLocation = useMemo(() => {
    if (!connection?.meet_location) return null;
    if (typeof connection.meet_location === 'string') {
      try {
        return JSON.parse(connection.meet_location);
      } catch {
        return null;
      }
    }
    return connection.meet_location;
  }, [connection?.meet_location]);

  const connectionMeetTime = useMemo(() => {
    if (!connection?.meet_time) return null;
    try {
      return new Date(connection.meet_time).toISOString();
    } catch {
      return null;
    }
  }, [connection?.meet_time]);

  const meetLocationName = connectionMeetLocation?.name || connectionMeetLocation?.location_name || null;
  const isMeetupConfirmed = Boolean(connection?.is_confirmed);
  const isMeetupCancelled = connection?.status === 'cancelled';
  const canConfirmMeetup = Boolean(connectionMeetLocation && connectionMeetTime && !isMeetupConfirmed && !isMeetupCancelled);
  const canShowPendingBanner = !isMeetupConfirmed && !isMeetupCancelled;

  const confirmedMeetupDescription = useMemo(() => {
    if (!isMeetupConfirmed || !connectionMeetTime) return null;
    try {
      const date = new Date(connectionMeetTime);
      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateString = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      return `${dateString} at ${timeString}${meetLocationName ? ` · ${meetLocationName}` : ''}`;
    } catch {
      return null;
    }
  }, [isMeetupConfirmed, connectionMeetTime, meetLocationName]);


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
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === payload.new.id);
            if (exists) return prev;
            const newMessage = payload.new as Message;
            if (newMessage.archived_at) {
              return prev;
            }
            return [...prev, newMessage];
          });
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => {
            if (updated.archived_at) {
              return prev.filter((msg) => msg.id !== updated.id);
            }
            return prev.map((msg) => (msg.id === updated.id ? updated : msg));
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, currentUser]);

  useEffect(() => {
    if (!connectionId) return;

    const connectionChannel = supabase
      .channel(`connection:${connectionId}:updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connections',
          filter: `id=eq.${connectionId}`,
        },
        (payload) => {
          console.log('[Chat] Connection updated:', payload.new);
          setConnection(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(connectionChannel);
    };
  }, [connectionId]);

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

      // Set navigation title and header right button
      navigation.setOptions({
        title: userData?.full_name || 'Chat',
        headerRight: () => (
          <TouchableOpacity
            onPress={() => setShowSafetyMenu(!showSafetyMenu)}
            style={{ paddingRight: 16 }}
          >
            <Text style={{ fontSize: 20 }}>⋯</Text>
          </TouchableOpacity>
        ),
      });
    } catch (error: any) {
      console.error('Error loading connection/user:', error);
      Alert.alert('Error', 'Failed to load chat');
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const fetchMessages = async (includeArchiveFilter: boolean) => {
        let query = supabase
          .from('messages')
          .select('*')
          .eq('connection_id', connectionId)
          .order('created_at', { ascending: true });

        if (includeArchiveFilter) {
          query = query.is('archived_at', null);
        }

        return query;
      };

      const { data, error } = await fetchMessages(true);

      if (error) {
        const needsFallback =
          error.code === '42703' ||
          error.hint?.includes('archived_at') ||
          error.details?.includes('archived_at') ||
          error.message?.toLowerCase().includes('archived_at');

        if (needsFallback) {
          console.warn(
            '[Chat] archived_at column missing, falling back to legacy query. Run migration 00009_midnight_reset.sql to enable daily message archive.',
            error
          );

          const { data: fallbackData, error: fallbackError } = await fetchMessages(false);

          if (fallbackError) {
            throw fallbackError;
          }

          setMessages(fallbackData || []);
        } else {
          throw error;
        }
      } else {
        setMessages(data || []);
      }

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
      const content = JSON.stringify({
        ...locationData,
        status: 'pending',
      });

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

  const sendTimeProposal = async (timeData: any) => {
    if (!currentUser || sending) return;

    setSending(true);

    try {
      const content = JSON.stringify({
        ...timeData,
        status: 'pending',
      });

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

      setMessages((prev) => [...prev, data as Message]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending time proposal:', error);
      Alert.alert('Error', 'Failed to send time proposal. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptLocationProposal = async (
    messageId: string,
    locationData: any
  ) => {
    if (!currentUser) return;

    try {
      const meetLocationPayload = {
        name: locationData.location_name,
        address: locationData.location_address,
        coordinates: locationData.location_coordinates,
      };

      const { error: connError } = await supabase
        .from('connections')
        .update({
          meet_location: JSON.stringify(meetLocationPayload),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (connError) throw connError;

      const updatedContent = {
        ...locationData,
        status: 'accepted',
      };

      const { error: messageError } = await supabase
        .from('messages')
        .update({
          content: JSON.stringify(updatedContent),
        })
        .eq('id', messageId);

      if (messageError) throw messageError;

      setConnection((prev: any) =>
        prev
          ? {
              ...prev,
              meet_location: JSON.stringify(meetLocationPayload),
            }
          : prev
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: JSON.stringify(updatedContent),
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Error accepting location proposal:', error);
      Alert.alert('Error', 'Failed to accept location. Please try again.');
    }
  };

  const handleAcceptTimeProposal = async (messageId: string, isoTime: string) => {
    if (!currentUser) return;

    try {
      const { error: connError } = await supabase
        .from('connections')
        .update({
          meet_time: isoTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (connError) throw connError;

      const updatedContent = {
        type: 'time',
        iso_time: isoTime,
        status: 'accepted',
      };

      const { error: messageError } = await supabase
        .from('messages')
        .update({
          content: JSON.stringify(updatedContent),
        })
        .eq('id', messageId);

      if (messageError) throw messageError;

      setConnection((prev: any) =>
        prev
          ? {
              ...prev,
              meet_time: isoTime,
            }
          : prev
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: JSON.stringify(updatedContent),
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Error accepting time proposal:', error);
      Alert.alert('Error', 'Failed to accept time. Please try again.');
    }
  };

  const handleConfirmMeetup = async () => {
    if (!currentUser || !connectionMeetTime || !connectionMeetLocation) return;
    setConfirming(true);
    try {
      const { error: connError } = await supabase
        .from('connections')
        .update({
          is_confirmed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (connError) throw connError;

      const date = new Date(connectionMeetTime);
      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateString = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

      await supabase.from('messages').insert({
        connection_id: connectionId,
        sender_id: currentUser.id,
        content: `Meetup confirmed for ${dateString} at ${timeString}${
          meetLocationName ? ` · ${meetLocationName}` : ''
        }.`,
        is_system_message: true,
      });

      setConnection((prev: any) =>
        prev
          ? {
              ...prev,
              is_confirmed: true,
              status: 'accepted',
            }
          : prev
      );
    } catch (error) {
      console.error('Error confirming meetup:', error);
      Alert.alert('Error', 'Failed to confirm meetup. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelMeetup = async (reason: string) => {
    if (!currentUser) return;
    setCanceling(true);
    try {
      const { error: connError } = await supabase
        .from('connections')
        .update({
          status: 'cancelled',
          is_confirmed: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (connError) throw connError;

      const datePart =
        connectionMeetTime && !isMeetupCancelled
          ? (() => {
              const date = new Date(connectionMeetTime);
              const dateString = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return `${dateString} at ${timeString}`;
            })()
          : null;

      const locationPart = meetLocationName ? ` · ${meetLocationName}` : '';
      const reasonPart = reason ? ` Reason: ${reason}` : '';

      await supabase.from('messages').insert({
        connection_id: connectionId,
        sender_id: currentUser.id,
        content: `Meetup cancelled${datePart ? ` (${datePart}${locationPart})` : ''}.${reasonPart}`,
        is_system_message: true,
      });

      setConnection((prev: any) =>
        prev
          ? {
              ...prev,
              status: 'cancelled',
              is_confirmed: false,
            }
          : prev
      );
    } catch (error) {
      console.error('Error cancelling meetup:', error);
      Alert.alert('Error', 'Failed to cancel meetup. Please try again.');
    } finally {
      setCanceling(false);
      setShowCancelModal(false);
    }
  };

  // Parse message content to detect special messages
  const parseMessageContent = (content: any) => {
    const parseJSON = (value: string) => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    if (!content) return null;

    if (typeof content === 'object') {
      return content?.type ? content : null;
    }

    if (typeof content !== 'string') return null;

    // Try direct parse
    let parsed = parseJSON(content.trim());
    if (parsed?.type) {
      return parsed;
    }

    // Handle double-encoded JSON (e.g., "\"{...}\"")
    if (content.startsWith('"') && content.endsWith('"')) {
      const unwrapped = content.slice(1, -1).replace(/\\"/g, '"');
      parsed = parseJSON(unwrapped);
      if (parsed?.type) {
        return parsed;
      }
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

              const parsedContent = parseMessageContent(message.content);

              if (parsedContent?.type === 'location') {
                const locationMatchesConnection =
                  !!connectionMeetLocation &&
                  (connectionMeetLocation.name === parsedContent.location_name ||
                    connectionMeetLocation.location_name === parsedContent.location_name) &&
                  (!connectionMeetLocation.address ||
                    connectionMeetLocation.address === parsedContent.location_address);
                const locationStatus =
                  parsedContent.status ||
                  (locationMatchesConnection ? 'accepted' : 'pending');

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
                        contentFit="cover"
                        transition={200}
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
                      locationData={parsedContent}
                      isMe={isMe}
                      status={locationStatus}
                      onAccept={() => {
                        handleAcceptLocationProposal(message.id, parsedContent);
                      }}
                      onProposeAlternative={() => {
                        setShowLocationPicker(true);
                      }}
                    />
                  </View>
                );
              }

              if (parsedContent?.type === 'time') {
                const normalizedMessageTime = (() => {
                  try {
                    return new Date(parsedContent.iso_time).toISOString();
                  } catch {
                    return parsedContent.iso_time;
                  }
                })();

                const timeStatus =
                  parsedContent.status ||
                  (connectionMeetTime && normalizedMessageTime === connectionMeetTime ? 'accepted' : 'pending');

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
                        contentFit="cover"
                        transition={200}
                      />
                    )}
                    {!isMe && !otherUser?.photo_url && (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {otherUser?.full_name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <TimeMessageCard
                      timeData={parsedContent}
                      isMe={isMe}
                      status={timeStatus}
                      onAccept={() => {
                        handleAcceptTimeProposal(message.id, parsedContent.iso_time);
                      }}
                      onProposeAlternative={() => {
                        setShowTimePicker(true);
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
                      contentFit="cover"
                      transition={200}
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

        {/* Safety Menu */}
        {showSafetyMenu && otherUser && (
          <View style={styles.safetyMenuContainer}>
            <TouchableOpacity
              style={styles.safetyMenuItem}
              onPress={() => {
                setShowReportForm(true);
                setShowSafetyMenu(false);
              }}
            >
              <Text style={styles.safetyMenuText}>Report User</Text>
            </TouchableOpacity>
            <View style={styles.safetyMenuDivider} />
            <View style={styles.safetyMenuItem}>
              <BlockButton
                userId={otherUserId}
                userName={otherUser.full_name}
                onBlocked={() => {
                  setShowSafetyMenu(false);
                  navigation.goBack();
                }}
                variant="default"
              />
            </View>
          </View>
        )}

        {/* Action Buttons Above Input */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.suggestLocationButton}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.suggestLocationIcon}>📍</Text>
            <Text style={styles.suggestLocationText}>Suggest Location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.suggestTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.suggestTimeIcon}>⏰</Text>
            <Text style={styles.suggestTimeText}>Suggest Time</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.confirmationContainer}>
          {isMeetupCancelled ? (
            <View style={[styles.confirmationBanner, styles.cancelledBanner]}>
              <Text style={styles.confirmationTitle}>Meetup cancelled ❌</Text>
              <Text style={styles.confirmationDetails}>You can suggest a new time or location if plans change.</Text>
            </View>
          ) : isMeetupConfirmed && confirmedMeetupDescription ? (
            <View style={[styles.confirmationBanner, styles.confirmedBanner]}>
              <Text style={styles.confirmationTitle}>Meetup Confirmed ✅</Text>
              <Text style={styles.confirmationDetails}>{confirmedMeetupDescription}</Text>
              <TouchableOpacity
                style={styles.cancelLink}
                onPress={() => setShowCancelModal(true)}
                disabled={canceling}
              >
                <Text style={styles.cancelLinkText}>{canceling ? 'Cancelling…' : 'Cancel meetup'}</Text>
              </TouchableOpacity>
            </View>
          ) : canConfirmMeetup ? (
            <TouchableOpacity
              style={[styles.confirmationBanner, styles.confirmButton]}
              onPress={handleConfirmMeetup}
              disabled={confirming}
            >
              <Text style={styles.confirmationTitle}>Everything agreed?</Text>
              <Text style={styles.confirmationDetails}>
                Confirm the meetup so it shows in Today&apos;s Plans for both of you.
              </Text>
              <View style={styles.confirmButtonRow}>
                <Text style={styles.confirmButtonText}>{confirming ? 'Confirming…' : 'Confirm meetup'}</Text>
              </View>
            </TouchableOpacity>
          ) : canShowPendingBanner ? (
            <View style={[styles.confirmationBanner, styles.pendingBanner]}>
              <Text style={styles.confirmationTitle}>Waiting to confirm</Text>
              <Text style={styles.confirmationDetails}>
                Accept a location and time to enable meetup confirmation.
              </Text>
            </View>
          ) : null}
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
        <TimePicker
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onSelect={sendTimeProposal}
        />
        <CancelMeetupModal
          visible={showCancelModal}
          onClose={() => !canceling && setShowCancelModal(false)}
          onConfirm={handleCancelMeetup}
          isSubmitting={canceling}
        />
        {otherUser && (
          <ReportForm
            visible={showReportForm}
            userId={otherUserId}
            userName={otherUser.full_name}
            onClose={() => setShowReportForm(false)}
          />
        )}
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
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
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
  suggestTimeButton: {
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
  suggestTimeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  suggestTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confirmationContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  confirmationBanner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  confirmedBanner: {
    backgroundColor: '#ecfdf5',
    borderColor: '#34d399',
  },
  pendingBanner: {
    backgroundColor: '#f9fafb',
  },
  confirmButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  confirmationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  confirmationDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  confirmButtonRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelledBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#f87171',
  },
  cancelLink: {
    marginTop: 12,
  },
  cancelLinkText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  safetyMenuContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  safetyMenuItem: {
    paddingVertical: 12,
  },
  safetyMenuText: {
    fontSize: 15,
    color: '#f59e0b',
    fontWeight: '600',
  },
  safetyMenuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
    fontWeight: '600',
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
