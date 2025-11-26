import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PlansScreenNavigationProp } from '../types/navigation';

type PlansScreenProps = {
  navigation: PlansScreenNavigationProp;
};

interface UserSummary {
  id: string;
  full_name: string;
  photo_url: string | null;
  neighbourhood: string | null;
}

interface RawConnection {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  connection_type: string;
  is_confirmed: boolean;
  meet_time: string | null;
  meet_location: any;
  requester: UserSummary | null;
  target: UserSummary | null;
}

interface Plan {
  id: string;
  meetTime: Date;
  meetTimeISO: string;
  meetLocationName: string | null;
  meetLocationAddress: string | null;
  meetLocationCoordinates: { lat: number; lng: number } | null;
  otherUser: UserSummary | null;
  planType: '1on1' | 'activity';
  activityTitle?: string | null;
  activityId?: string | null;
}

function parseLocation(meetLocation: any): {
  name: string | null;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
} {
  if (!meetLocation) {
    return { name: null, address: null, coordinates: null };
  }

  if (typeof meetLocation === 'string') {
    try {
      const parsed = JSON.parse(meetLocation);
      return parseLocation(parsed);
    } catch {
      return { name: meetLocation, address: null, coordinates: null };
    }
  }

  return {
    name: meetLocation.name ?? meetLocation.location_name ?? null,
    address: meetLocation.address ?? meetLocation.location_address ?? null,
    coordinates:
      meetLocation.coordinates && meetLocation.coordinates.lat && meetLocation.coordinates.lng
        ? { lat: Number(meetLocation.coordinates.lat), lng: Number(meetLocation.coordinates.lng) }
        : null,
  };
}

function formatRelativeTime(meetTime: Date) {
  const diffMs = meetTime.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes >= 0) {
    if (diffMinutes <= 1) return 'Starts in 1 minute';
    if (diffMinutes < 60) return `Starts in ${diffMinutes} minutes`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Starts in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  } else {
    const minutesAgo = Math.abs(diffMinutes);
    if (minutesAgo <= 1) return 'Started 1 minute ago';
    if (minutesAgo < 60) return `Started ${minutesAgo} minutes ago`;
    const hoursAgo = Math.round(minutesAgo / 60);
    if (hoursAgo < 24) return `Started ${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
  }

  return `On ${meetTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })}`;
}

function formatAbsoluteTime(meetTime: Date) {
  return meetTime.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleOpenMaps(location: {
  name: string | null;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
}) {
  const fallbackQuery = location.address || location.name;

  if (!fallbackQuery) {
    Alert.alert('Location unavailable', 'Location details are missing for this meetup.');
    return;
  }

  const encodedLabel = encodeURIComponent(location.name ?? fallbackQuery);

  const buildAppleMapsUrl = () => {
    if (location.coordinates) {
      return `http://maps.apple.com/?ll=${location.coordinates.lat},${location.coordinates.lng}&q=${encodedLabel}`;
    }
    return `http://maps.apple.com/?q=${encodedLabel}`;
  };

  const buildGoogleMapsUrl = () => {
    if (location.coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`;
  };

  const buildAndroidMapsUri = () => {
    if (location.coordinates) {
      return `geo:${location.coordinates.lat},${location.coordinates.lng}?q=${location.coordinates.lat},${location.coordinates.lng}(${encodedLabel})`;
    }
    return `geo:0,0?q=${encodeURIComponent(fallbackQuery)}(${encodedLabel})`;
  };

  const openUrl = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
      return true;
    }
    return false;
  };

  if (Platform.OS === 'ios') {
    openUrl(buildAppleMapsUrl()).then((opened) => {
      if (!opened) openUrl(buildGoogleMapsUrl());
    });
  } else if (Platform.OS === 'android') {
    openUrl(buildAndroidMapsUri()).then((opened) => {
      if (!opened) openUrl(buildGoogleMapsUrl());
    });
  } else {
    openUrl(buildGoogleMapsUrl());
  }
}

export default function PlansScreen({ navigation }: PlansScreenProps) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadPlans = useCallback(async () => {
    if (!user?.id) {
      setPlans([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      // Load 1:1 confirmed connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select(
          `
          id,
          requester_id,
          target_id,
          status,
          connection_type,
          is_confirmed,
          meet_time,
          meet_location,
          requester:users!connections_requester_id_fkey ( id, full_name, photo_url, neighbourhood ),
          target:users!connections_target_id_fkey ( id, full_name, photo_url, neighbourhood )
        `
        )
        .eq('connection_type', '1on1')
        .eq('status', 'accepted')
        .eq('is_confirmed', true)
        .not('meet_time', 'is', null)
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
        .order('meet_time', { ascending: true });

      if (connectionsError) throw connectionsError;

      // Load confirmed activities where user is a participant
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select(
          `
          id,
          title,
          location_name,
          start_time,
          end_time,
          host_id
        `
        )
        .eq('status', 'confirmed')
        .gte('start_time', new Date().toISOString().split('T')[0])
        .order('start_time', { ascending: true });

      if (activitiesError) throw activitiesError;

      // Get connections for activities to check if user is a participant
      const activityIds = activitiesData?.map((a) => a.id) || [];
      const { data: activityConnections, error: activityConnectionsError } = await supabase
        .from('connections')
        .select('activity_id, status')
        .in('activity_id', activityIds)
        .eq('requester_id', user.id)
        .eq('connection_type', 'pile_on')
        .eq('status', 'accepted');

      if (activityConnectionsError) throw activityConnectionsError;

      const userActivityIds = new Set(
        activityConnections?.map((c) => c.activity_id) || []
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Process 1:1 connections
      const connectionPlans: Plan[] =
        connectionsData
          ?.map((connection: RawConnection) => {
            if (!connection.meet_time) return null;
            const meetTime = new Date(connection.meet_time);
            const isSameDay =
              meetTime.getFullYear() === today.getFullYear() &&
              meetTime.getMonth() === today.getMonth() &&
              meetTime.getDate() === today.getDate();

            if (!isSameDay) return null;

            const otherUser =
              connection.requester_id === user.id
                ? connection.target
                : connection.requester;

            if (!otherUser) return null;

            const location = parseLocation(connection.meet_location);

            return {
              id: connection.id,
              meetTime,
              meetTimeISO: connection.meet_time,
              meetLocationName: location.name,
              meetLocationAddress: location.address,
              meetLocationCoordinates: location.coordinates,
              otherUser,
              planType: '1on1' as const,
            };
          })
          .filter((plan): plan is Plan => plan !== null) ?? [];

      // Process activities
      const activityPlans: Plan[] =
        activitiesData
          ?.filter((activity) => userActivityIds.has(activity.id))
          .map((activity) => {
            const startTime = new Date(activity.start_time);
            const isSameDay =
              startTime.getFullYear() === today.getFullYear() &&
              startTime.getMonth() === today.getMonth() &&
              startTime.getDate() === today.getDate();

            if (!isSameDay) return null;

            return {
              id: activity.id,
              meetTime: startTime,
              meetTimeISO: activity.start_time,
              meetLocationName: activity.location_name,
              meetLocationAddress: null,
              meetLocationCoordinates: null,
              otherUser: null,
              planType: 'activity' as const,
              activityTitle: activity.title,
              activityId: activity.id,
            };
          })
          .filter((plan): plan is Plan => plan !== null) ?? [];

      // Combine and sort by time
      const allPlans = [...connectionPlans, ...activityPlans].sort(
        (a, b) => a.meetTime.getTime() - b.meetTime.getTime()
      );

      setPlans(allPlans);
    } catch (err) {
      console.error('Error loading plans:', err);
      Alert.alert('Error', 'Failed to load today's plans. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlans();
  }, [loadPlans]);

  const upcomingPlan = useMemo(() => {
    if (plans.length === 0) return null;
    return plans[0];
  }, [plans]);

  const handleOpenChat = useCallback(
    (plan: Plan) => {
      if (plan.planType === '1on1' && plan.otherUser) {
        navigation.navigate('Chats', {
          screen: 'Chat',
          params: { connectionId: plan.id, userId: plan.otherUser.id },
        });
      } else if (plan.planType === 'activity' && plan.activityId) {
        // Navigate to Activities tab, then to ActivityChat
        const parent = navigation.getParent();
        if (parent) {
          (parent as any).navigate('Activities', {
            screen: 'ActivityChat',
            params: { activityId: plan.activityId },
          });
        }
      }
    },
    [navigation]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Today’s Plans</Text>
          <Text style={styles.subtitle}>Confirmed meetups happen here</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading your plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today’s Plans</Text>
        <Text style={styles.subtitle}>
          {plans.length > 0
            ? `${plans.length} confirmed ${plans.length === 1 ? 'meetup' : 'meetups'}`
            : 'No confirmed meetups yet'}
        </Text>
      </View>

      {upcomingPlan ? (
        <View style={styles.upNextCard}>
          <Text style={styles.upNextLabel}>UP NEXT</Text>
          <Text style={styles.upNextTitle}>
            {upcomingPlan.planType === '1on1' && upcomingPlan.otherUser
              ? upcomingPlan.otherUser.full_name.split(' ')[0] || upcomingPlan.otherUser.full_name
              : upcomingPlan.activityTitle || 'Activity'}
          </Text>
          <Text style={styles.upNextTime}>{formatRelativeTime(upcomingPlan.meetTime)}</Text>
          <Text style={styles.upNextMeta}>{formatAbsoluteTime(upcomingPlan.meetTime)}</Text>
          {upcomingPlan.meetLocationName && (
            <Text style={styles.upNextMeta}>{upcomingPlan.meetLocationName}</Text>
          )}
          <View style={styles.upNextButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => handleOpenChat(upcomingPlan)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>
                {upcomingPlan.planType === 'activity' ? 'Open Chat' : 'Open Chat'}
              </Text>
            </TouchableOpacity>
            {upcomingPlan.meetLocationName && (
              <TouchableOpacity
                style={[styles.actionButton, styles.mapButton]}
                onPress={() =>
                  handleOpenMaps({
                    name: upcomingPlan.meetLocationName,
                    address: upcomingPlan.meetLocationAddress,
                    coordinates: upcomingPlan.meetLocationCoordinates,
                  })
                }
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Open Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌤️</Text>
          <Text style={styles.emptyTitle}>No plans locked in yet</Text>
          <Text style={styles.emptySubtitle}>
            Confirm a meetup to have it show up here. Everything resets each morning.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={plans.length === 0 ? styles.emptyContent : undefined}
      >
        {plans.map((plan) => {
          if (!plan || !plan.id || !plan.otherUser) {
            console.warn('[Plans] Invalid plan:', plan);
            return null;
          }

          const relativeTime = formatRelativeTime(plan.meetTime);
          const absoluteTime = formatAbsoluteTime(plan.meetTime);
          const locationDisplay =
            plan.meetLocationName || plan.meetLocationAddress || 'Location to be shared';

          return (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                {plan.planType === '1on1' && plan.otherUser ? (
                  <>
                    {plan.otherUser.photo_url ? (
                      <Image source={{ uri: plan.otherUser.photo_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>
                          {(plan.otherUser.full_name || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.planHeaderDetails}>
                      <Text style={styles.planName}>
                        {plan.otherUser.full_name || 'Unknown User'}
                      </Text>
                      <Text style={styles.planLocation}>{locationDisplay}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.activityIcon}>
                      <Text style={styles.activityIconText}>📅</Text>
                    </View>
                    <View style={styles.planHeaderDetails}>
                      <Text style={styles.planName}>{plan.activityTitle || 'Activity'}</Text>
                      <Text style={styles.planLocation}>{locationDisplay}</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.planBody}>
                <View style={styles.planTimeRow}>
                  <Text style={styles.timeIcon}>⏰</Text>
                  <View style={styles.timeDetails}>
                    <Text style={styles.relativeTime}>{relativeTime}</Text>
                    <Text style={styles.absoluteTime}>{absoluteTime}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.planActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.chatButton]}
                  onPress={() => handleOpenChat(plan)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>
                    {plan.planType === 'activity' ? 'Open Chat' : 'Open Chat'}
                  </Text>
                </TouchableOpacity>
                {plan.meetLocationName && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.mapButton]}
                    onPress={() =>
                      handleOpenMaps({
                        name: plan.meetLocationName,
                        address: plan.meetLocationAddress,
                        coordinates: plan.meetLocationCoordinates,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>Open Maps</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }).filter(Boolean)}
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
  upNextCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34d399',
    gap: 6,
  },
  upNextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    letterSpacing: 1,
  },
  upNextTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#065f46',
  },
  upNextTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
  },
  upNextMeta: {
    fontSize: 13,
    color: '#047857',
  },
  upNextButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  planHeaderDetails: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  planLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  planBody: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    paddingVertical: 16,
  },
  planTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeIcon: {
    fontSize: 28,
  },
  timeDetails: {
    flex: 1,
  },
  relativeTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  absoluteTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: '#10b981',
  },
  mapButton: {
    backgroundColor: '#111827',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 24,
  },
});

