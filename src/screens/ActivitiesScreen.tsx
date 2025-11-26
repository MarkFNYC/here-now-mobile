import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLocation } from '../hooks/useLocation';
import { ActivityCard } from '../components/ActivityCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivitiesStackParamList } from '../types/navigation';

interface NearbyActivity {
  id: string;
  title: string;
  description: string | null;
  activity_type: string;
  location_name: string;
  start_time: string;
  end_time: string;
  is_one_on_one: boolean;
  host_id: string;
  host_name: string;
  distance_km: number;
  participant_count: number;
  max_participants?: number | null;
}

type ActivitiesScreenProps = NativeStackScreenProps<ActivitiesStackParamList, 'ActivitiesList'>;

export default function ActivitiesScreen({ navigation }: ActivitiesScreenProps) {
  const { user } = useAuth();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [activities, setActivities] = useState<NearbyActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(null);
  const [joinedActivities, setJoinedActivities] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchActivities = useCallback(async () => {
    // If no location, use a default location (Clapham Common) for testing
    const lat = location?.latitude || 51.4526;
    const lng = location?.longitude || -0.1476;
    
    if (fetchingRef.current) {
      console.log('[Activities] Skipping fetch - already fetching');
      return;
    }

    console.log('[Activities] Fetching activities for location:', lat, lng, 'hasLocation:', !!location);
    fetchingRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_nearby_activities', {
        user_lat: lat,
        user_lng: lng,
        radius_km: 50, // Increased to 50km for testing (was 5km)
      });

      if (error) {
        console.error('[Activities] RPC error:', error);
        throw error;
      }

      console.log('[Activities] Raw data from RPC:', data?.length || 0, 'activities');

      // Filter to active activities with start_time > NOW()
      const now = new Date().toISOString();
      console.log('[Activities] Current time:', now);
      const activeActivities = (data || []).filter(
        (activity: NearbyActivity) => {
          const isFuture = activity.start_time > now;
          if (!isFuture) {
            console.log('[Activities] Filtered out (past):', activity.title, activity.start_time);
          }
          return isFuture;
        }
      );

      console.log('[Activities] After time filter:', activeActivities.length, 'activities');

      // Sort by start time, then distance
      activeActivities.sort((a: any, b: any) => {
        const timeDiff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.distance_km - b.distance_km;
      });

      console.log('[Activities] Final activities to display:', activeActivities.length);
      setActivities(activeActivities);
      setError(null);
    } catch (error: any) {
      console.error('[Activities] Error fetching activities:', error);
      setError(error.message || 'Failed to load activities');
      setActivities([]); // Clear activities on error
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [location, locationLoading]);

  const loadJoinedActivities = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select('activity_id')
        .eq('requester_id', user.id)
        .eq('connection_type', 'pile_on')
        .in('status', ['pending', 'accepted']);

      if (error) {
        console.error('[Activities] Error loading joined activities:', error);
        return;
      }

      const joinedSet = new Set((data || []).map((conn: any) => conn.activity_id));
      setJoinedActivities(joinedSet);
    } catch (error: any) {
      console.error('[Activities] Error loading joined activities:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadJoinedActivities();
    }
  }, [user?.id, loadJoinedActivities]);

  useEffect(() => {
    // Fetch activities when location is available, or after a short delay if location is slow
    if (location && !locationLoading) {
      fetchActivities();
    } else if (!locationLoading && !location) {
      // If location failed or is taking too long, fetch with default location after 2 seconds
      const timer = setTimeout(() => {
        console.log('[Activities] Location not available, using default location');
        fetchActivities();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location, locationLoading, fetchActivities]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchActivities(), loadJoinedActivities()]).finally(() => setRefreshing(false));
  }, [fetchActivities, loadJoinedActivities]);

  const isStartingSoon = (startTime: string) => {
    try {
      const start = new Date(startTime);
      const now = new Date();
      const diffMinutes = Math.round((start.getTime() - now.getTime()) / 60000);
      return diffMinutes >= 0 && diffMinutes <= 30;
    } catch {
      return false;
    }
  };

  const handleJoinActivity = async (activity: NearbyActivity) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to join activities');
      return;
    }

    // Check if user is the host
    if (activity.host_id === user.id) {
      Alert.alert('Cannot Join', 'You cannot join your own activity');
      return;
    }

    // Check capacity
    if (activity.max_participants && activity.participant_count >= activity.max_participants) {
      Alert.alert('Activity Full', 'This activity has reached its maximum capacity');
      return;
    }

    // Check if already joined
    if (joinedActivities.has(activity.id)) {
      Alert.alert('Already Joined', 'You have already joined this activity');
      return;
    }

    setJoiningActivityId(activity.id);
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          activity_id: activity.id,
          requester_id: user.id,
          target_id: activity.host_id, // Host is the target for pile-on
          connection_type: 'pile_on',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately (optimistic update)
      setJoinedActivities((prev) => new Set([...prev, activity.id]));
      
      // Don't refresh activities immediately - keep the activity visible
      // Just reload the joined status to ensure consistency
      await loadJoinedActivities();
      
      Alert.alert(
        'Join Request Sent!',
        'Waiting for host confirmation. You\'ll be notified when they respond.'
      );
    } catch (error: any) {
      console.error('[Activities] Error joining activity:', error);
      
      if (error.code === '23505') {
        // Unique constraint violation - already joined
        Alert.alert('Already Joined', 'You have already requested to join this activity');
        setJoinedActivities((prev) => new Set([...prev, activity.id]));
      } else {
        Alert.alert('Error', 'Failed to join activity. Please try again.');
      }
    } finally {
      setJoiningActivityId(null);
    }
  };

  const handleActivityPress = (activityId: string) => {
    navigation.navigate('ActivityDetail', { activityId });
  };

  // Show loading only briefly, then show content even without location
  // This prevents the screen from being blank if location takes time
  if (locationLoading && !location && activities.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Activities</Text>
          <Text style={styles.subtitle}>Happening today nearby</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Activities</Text>
            <Text style={styles.subtitle}>Happening today nearby</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('ActivityCreation')}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚠️</Text>
            <Text style={styles.emptyTitle}>Error loading activities</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                fetchActivities();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading && activities.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No activities nearby</Text>
            <Text style={styles.emptyText}>
              Turn ON to see pile-on activities happening nearby, or create your own!
            </Text>
          </View>
        ) : (
          activities.map((activity) => {
            if (!activity || !activity.id) {
              console.warn('[Activities] Invalid activity:', activity);
              return null;
            }

            const isHost = activity.host_id === user?.id;
            const isJoined = joinedActivities.has(activity.id);
            const isAtCapacity = activity.max_participants
              ? activity.participant_count >= activity.max_participants
              : false;

            return (
              <ActivityCard
                key={activity.id}
                id={activity.id}
                title={activity.title || 'Untitled Activity'}
                activityType={activity.activity_type || 'Activity'}
                locationName={activity.location_name || 'Location TBD'}
                startTime={activity.start_time}
                endTime={activity.end_time}
                hostName={activity.host_name || 'Unknown Host'}
                participantCount={activity.participant_count || 0}
                maxParticipants={activity.max_participants}
                distanceKm={activity.distance_km || 0}
                isStartingSoon={isStartingSoon(activity.start_time)}
                isHost={isHost}
                isJoined={isJoined}
                isAtCapacity={isAtCapacity}
                isJoining={joiningActivityId === activity.id}
                onPress={() => handleActivityPress(activity.id)}
                onJoin={() => handleJoinActivity(activity)}
              />
            );
          }).filter(Boolean)
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  createButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
  retryButton: {
    marginTop: 16,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});
