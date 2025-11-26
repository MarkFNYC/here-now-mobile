import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLocation } from '../hooks/useLocation';
import { LocationPicker } from '../components/LocationPicker';
import { TimePicker } from '../components/TimePicker';
import { ActivitiesStackParamList } from '../types/navigation';

type ActivityCreationScreenProps = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityCreation'>;

const ACTIVITY_TYPES = [
  'Coffee',
  'Drinks',
  'Walks',
  'Sports',
  'Food',
  'Games',
  'Creative',
  'Wellness',
  'Professional',
];

interface LocationData {
  type: 'location';
  location_name: string;
  location_address: string;
  location_coordinates: {
    lat: number;
    lng: number;
  };
}

interface TimeData {
  type: 'time';
  iso_time: string;
}

export default function ActivityCreationScreen({ navigation }: ActivityCreationScreenProps) {
  const { user } = useAuth();
  const { location } = useLocation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState<string>('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [startTime, setStartTime] = useState<TimeData | null>(null);
  const [endTime, setEndTime] = useState<TimeData | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [isOneOnOne, setIsOneOnOne] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleCreate = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to create activities');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an activity title');
      return;
    }

    if (!activityType) {
      Alert.alert('Required', 'Please select an activity type');
      return;
    }

    if (!locationData) {
      Alert.alert('Required', 'Please select a location');
      return;
    }

    if (!startTime) {
      Alert.alert('Required', 'Please select a start time');
      return;
    }

    if (!endTime) {
      Alert.alert('Required', 'Please select an end time');
      return;
    }

    const startDate = new Date(startTime.iso_time);
    const endDate = new Date(endTime.iso_time);

    if (endDate <= startDate) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    if (startDate < new Date()) {
      Alert.alert('Invalid Time', 'Start time must be in the future');
      return;
    }

    setCreating(true);
    try {
      // Convert location coordinates to PostGIS format
      const approximateLocation = `POINT(${locationData.location_coordinates.lng} ${locationData.location_coordinates.lat})`;

      // Calculate expires_at (end of day)
      const expiresAt = new Date(endDate);
      expiresAt.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('activities')
        .insert({
          host_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          activity_type: activityType,
          location_name: locationData.location_name,
          approximate_location: approximateLocation,
          start_time: startTime.iso_time,
          end_time: endTime.iso_time,
          is_one_on_one: isOneOnOne,
          max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
          status: 'active',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success!', 'Your activity has been created. Others can now join!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.replace('ActivityDetail', { activityId: data.id });
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error creating activity:', error);
      Alert.alert('Error', error.message || 'Failed to create activity. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const formatTimeDisplay = (timeData: TimeData | null) => {
    if (!timeData) return 'Select time';
    const date = new Date(timeData.iso_time);
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Activity</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Coffee at Mayfield"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details about your activity..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Activity Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Activity Type *</Text>
          <View style={styles.typeGrid}>
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, activityType === type && styles.typeButtonSelected]}
                onPress={() => setActivityType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    activityType === type && styles.typeButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {locationData ? locationData.location_name : 'Select location'}
            </Text>
            <Text style={styles.pickerButtonSubtext}>
              {locationData ? locationData.location_address : 'Tap to choose'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Start Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Start Time *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text style={styles.pickerButtonText}>{formatTimeDisplay(startTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* End Time */}
        <View style={styles.section}>
          <Text style={styles.label}>End Time *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text style={styles.pickerButtonText}>{formatTimeDisplay(endTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* Max Participants */}
        <View style={styles.section}>
          <Text style={styles.label}>Max Participants (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Leave empty for unlimited"
            placeholderTextColor="#9ca3af"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            Leave empty to allow unlimited participants
          </Text>
        </View>

        {/* 1:1 Only Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsOneOnOne(!isOneOnOne)}
          >
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>1:1 Only</Text>
              <Text style={styles.toggleSubtext}>
                Only allow one-on-one connections (no pile-ons)
              </Text>
            </View>
            <View style={[styles.toggle, isOneOnOne && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isOneOnOne && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>Create Activity</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(location) => {
          setLocationData(location);
          setShowLocationPicker(false);
        }}
      />

      {/* Start Time Picker Modal */}
      <TimePicker
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        onSelect={(time) => {
          setStartTime(time);
          setShowStartTimePicker(false);
        }}
      />

      {/* End Time Picker Modal */}
      <TimePicker
        visible={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        onSelect={(time) => {
          setEndTime(time);
          setShowEndTimePicker(false);
        }}
      />
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
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typeButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  typeButtonTextSelected: {
    color: '#ffffff',
  },
  pickerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  pickerButtonSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  toggleContent: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#10b981',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  createButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});


