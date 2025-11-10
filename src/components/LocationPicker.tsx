import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocation } from '../hooks/useLocation';

interface LocationData {
  type: 'location';
  location_name: string;
  location_address: string;
  location_coordinates: {
    lat: number;
    lng: number;
  };
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
}

export function LocationPicker({ visible, onClose, onSelect }: LocationPickerProps) {
  const { location } = useLocation();
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handleSuggestCommon = (locationInfo: { name: string; address: string; lat: number; lng: number }) => {
    const locationData: LocationData = {
      type: 'location',
      location_name: locationInfo.name,
      location_address: locationInfo.address,
      location_coordinates: {
        lat: locationInfo.lat,
        lng: locationInfo.lng,
      },
    };

    onSelect(locationData);
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!locationName.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    // Use provided coordinates or current location
    let coordinates;
    if (lat && lng) {
      coordinates = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };
    } else if (location) {
      coordinates = {
        lat: location.latitude,
        lng: location.longitude,
      };
    } else {
      Alert.alert('Error', 'Please provide coordinates or enable location services');
      return;
    }

    const locationData: LocationData = {
      type: 'location',
      location_name: locationName.trim(),
      location_address: address.trim(),
      location_coordinates: coordinates,
    };

    onSelect(locationData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setLocationName('');
    setAddress('');
    setLat('');
    setLng('');
  };

  const commonLocations = [
    { 
      name: 'Clapham Common', 
      address: 'Clapham Common, London SW4',
      lat: 51.4618,
      lng: -0.1377
    },
    { 
      name: 'Clapham High Street', 
      address: 'Clapham High Street, London SW4',
      lat: 51.4615,
      lng: -0.1310
    },
    { 
      name: 'Clapham Junction', 
      address: 'Clapham Junction Station, London SW11',
      lat: 51.4642,
      lng: -0.1703
    },
    { 
      name: 'Battersea Park', 
      address: 'Battersea Park, London SW11',
      lat: 51.4778,
      lng: -0.1556
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Suggest Location</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Quick Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Suggestions</Text>
            {commonLocations.map((loc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => handleSuggestCommon(loc)}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionName}>{loc.name}</Text>
                  <Text style={styles.suggestionAddress}>{loc.address}</Text>
                  <Text style={styles.suggestionCoords}>
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Location name (e.g., Mayfield Cafe)"
              placeholderTextColor="#9ca3af"
              value={locationName}
              onChangeText={setLocationName}
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor="#9ca3af"
              value={address}
              onChangeText={setAddress}
            />
            <View style={styles.coordinateRow}>
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                placeholder="Latitude (optional)"
                placeholderTextColor="#9ca3af"
                value={lat}
                onChangeText={setLat}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                placeholder="Longitude (optional)"
                placeholderTextColor="#9ca3af"
                value={lng}
                onChangeText={setLng}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.helperText}>
              {location
                ? 'Using your current location as coordinates'
                : 'Enter coordinates or enable location services'}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Suggest Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  suggestionButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  suggestionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  suggestionAddress: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  suggestionCoords: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: -8,
    marginBottom: 8,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

