import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLocation } from '../hooks/useLocation';
import { UserCard } from '../components/UserCard';

interface NearbyUser {
  id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  activity_tags: string[] | null;
  distance_km: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState<Set<string>>(new Set());
  const fetchingRef = useRef(false); // Prevent concurrent fetches

  // Memoize fetchConnectionRequests to avoid recreating on every render
  const fetchConnectionRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select('connected_user_id')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const requestedUserIds = new Set(data.map(conn => conn.connected_user_id));
      setConnectionRequests(requestedUserIds);
    } catch (error: any) {
      console.error('Error fetching connection requests:', error);
    }
  }, [user]);

  // Memoize fetchNearbyUsers to avoid recreating on every render
  const fetchNearbyUsers = useCallback(async () => {
    if (!location || fetchingRef.current) return;

    fetchingRef.current = true;
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.rpc('get_nearby_users', {
        user_lat: location.latitude,
        user_lng: location.longitude,
        radius_km: 50, // Search within 50km for testing
      });

      if (error) throw error;

      setNearbyUsers(data || []);
      console.log('Found nearby users:', data);

      // Also fetch existing connection requests to show correct button states
      await fetchConnectionRequests();
    } catch (error: any) {
      console.error('Error fetching nearby users:', error);
    } finally {
      setLoadingUsers(false);
      fetchingRef.current = false;
    }
  }, [location, fetchConnectionRequests]);

  // Load initial state from user (only when user changes, not on every render)
  useEffect(() => {
    if (user) {
      // Ensure we always pass a boolean, not a string
      setIsOn(Boolean(user.is_on));
    }
  }, [user?.is_on]); // Only depend on is_on, not entire user object

  // Fetch nearby users when location becomes available or isOn changes
  useEffect(() => {
    if (isOn && location && !locationLoading && !fetchingRef.current) {
      fetchNearbyUsers();
    }
  }, [isOn, location?.latitude, location?.longitude, locationLoading, fetchNearbyUsers]);


  async function createConnectionRequest(targetUserId: string) {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          connected_user_id: targetUserId,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state to update UI
      setConnectionRequests(prev => new Set(prev).add(targetUserId));

      Alert.alert(
        'Connection Request Sent! 👋',
        'They\'ll be notified and can accept your request.'
      );

      console.log('Connection request created:', data);
      return data;
    } catch (error: any) {
      console.error('Error creating connection:', error);
      Alert.alert('Error', 'Failed to send connection request. Please try again.');
    }
  }

  const handleToggle = async (value: boolean) => {
    if (!user) return;

    // Check location availability
    if (value && !location) {
      Alert.alert(
        'Location Required',
        locationError || 'Please enable location services to turn ON',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    setIsOn(value); // Optimistic update

    try {
      if (value && location) {
        // When turning ON, use SQL to update with location
        const { data, error: sqlError } = await supabase.rpc('exec_sql', {
          query: `
            UPDATE users
            SET
              is_on = true,
              last_toggled_on = NOW(),
              location = ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography
            WHERE id = '${user.id}'
            RETURNING *
          `,
        });

        // If RPC doesn't work, try the update_user_location function
        if (sqlError) {
          console.log('Trying update_user_location function...');

          // First update is_on
          await supabase
            .from('users')
            .update({
              is_on: true,
              last_toggled_on: new Date().toISOString(),
            })
            .eq('id', user.id);

          // Then update location
          const { error: locError } = await supabase.rpc('update_user_location', {
            user_id: user.id,
            lat: location.latitude,
            lng: location.longitude,
          });

          if (locError) {
            console.error('Location save failed:', locError);
            throw new Error('Failed to save location: ' + locError.message);
          }
        }
      } else {
        // When turning OFF, just update basic fields
        const { error: updateError } = await supabase
          .from('users')
          .update({
            is_on: value,
            last_toggled_on: value ? new Date().toISOString() : null,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      Alert.alert(
        'Success',
        value
          ? `You're now ON and visible! Location saved: ${location?.latitude.toFixed(4)}, ${location?.longitude.toFixed(4)}`
          : "You're now OFF"
      );
    } catch (error: any) {
      // Revert on error
      setIsOn(!value);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Here Now</Text>
        <Text style={styles.subtitle}>
          {user?.neighbourhood || 'Your Neighborhood'}
        </Text>

        {/* Location Status */}
        {locationLoading && (
          <View style={styles.locationCard}>
            <ActivityIndicator color="#10b981" />
            <Text style={styles.locationText}>Getting your location...</Text>
          </View>
        )}

        {locationError && (
          <View style={[styles.locationCard, styles.errorCard]}>
            <Text style={styles.errorText}>📍 {locationError}</Text>
            <Text style={styles.errorSubtext}>
              Location is required to use Here Now
            </Text>
          </View>
        )}

        {location && !locationLoading && (
          <View style={styles.locationCard}>
            <Text style={styles.locationText}>
              📍 Location ready: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Toggle Section */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleContent}>
            <View>
              <Text style={styles.toggleTitle}>
                {isOn ? "You're ON" : "You're OFF"}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {isOn
                  ? 'Visible to neighbors nearby'
                  : 'Turn on to see who else is around'}
              </Text>
            </View>
            <Switch
              value={isOn}
              onValueChange={handleToggle}
              trackColor={{ false: '#d1d5db', true: '#6ee7b7' }}
              thumbColor={isOn ? '#10b981' : '#f4f4f5'}
              disabled={loading}
            />
          </View>
        </View>

        {/* Status Message */}
        {!isOn && (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>
              Toggle ON to discover neighbors who are free right now
            </Text>
          </View>
        )}

        {isOn && nearbyUsers.length === 0 && !loadingUsers && (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>
              🎉 You're now visible! Looking for nearby users...
            </Text>
          </View>
        )}

        {/* Nearby Users Feed */}
        {isOn && (
          <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
            {loadingUsers && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Finding nearby users...</Text>
              </View>
            )}

            {!loadingUsers && nearbyUsers.length > 0 && (
              <>
                <Text style={styles.feedHeader}>
                  {nearbyUsers.length} {nearbyUsers.length === 1 ? 'person' : 'people'} nearby
                </Text>
                {nearbyUsers.map((nearbyUser) => (
                  <UserCard
                    key={nearbyUser.id}
                    name={nearbyUser.full_name}
                    bio={nearbyUser.bio}
                    activityTags={nearbyUser.activity_tags}
                    distance={nearbyUser.distance_km}
                    photoUrl={nearbyUser.photo_url}
                    isPending={connectionRequests.has(nearbyUser.id)}
                    onSayHi={() => createConnectionRequest(nearbyUser.id)}
                    onPass={() => {
                      setNearbyUsers(nearbyUsers.filter(u => u.id !== nearbyUser.id));
                    }}
                  />
                ))}
              </>
            )}

            {!loadingUsers && nearbyUsers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👋</Text>
                <Text style={styles.emptyTitle}>No one nearby right now</Text>
                <Text style={styles.emptyText}>
                  Check back later or invite friends to join Here Now!
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
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
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
  },
  toggleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  toggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  messageCard: {
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  messageText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7dd3fc',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#075985',
    flex: 1,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 11,
    color: '#dc2626',
  },
  feedContainer: {
    flex: 1,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  feedHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
