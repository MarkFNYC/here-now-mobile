import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';

interface LocationData {
  type: 'location';
  location_name: string;
  location_address: string;
  location_coordinates: {
    lat: number;
    lng: number;
  };
}

interface LocationMessageCardProps {
  locationData: LocationData;
  isMe: boolean;
  onAccept?: () => void;
  onProposeAlternative?: () => void;
}

export function LocationMessageCard({ locationData, isMe, onAccept, onProposeAlternative }: LocationMessageCardProps) {
  const handleOpenMaps = async () => {
    const { lat, lng } = locationData.location_coordinates;
    const locationName = encodeURIComponent(locationData.location_name);
    
    // Try platform-specific URLs first, then fallback to Google Maps web
    let url: string;
    
    if (Platform.OS === 'ios') {
      // Try Apple Maps first
      url = `maps://maps.apple.com/?q=${locationName}&ll=${lat},${lng}`;
    } else if (Platform.OS === 'android') {
      // Try Google Maps app, fallback to geo: scheme
      url = `google.navigation:q=${lat},${lng}`;
    } else {
      // Web - use Google Maps web
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web for all platforms
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        await Linking.openURL(googleMapsUrl);
      }
    } catch (err) {
      console.error('Error opening maps:', err);
      // Final fallback - always try Google Maps web
      try {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        await Linking.openURL(googleMapsUrl);
      } catch (fallbackErr) {
        console.error('Error with fallback URL:', fallbackErr);
        Alert.alert('Error', 'Unable to open maps. Please search for the location manually.');
      }
    }
  };

  return (
    <View style={[styles.container, isMe ? styles.myContainer : styles.otherContainer]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📍</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Suggested Location</Text>
        <Text style={styles.locationName}>{locationData.location_name}</Text>
        <Text style={styles.address}>{locationData.location_address}</Text>
        <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
          <Text style={styles.mapButtonText}>Open in Maps</Text>
        </TouchableOpacity>
        {!isMe && (
          <View style={styles.actionButtons}>
            {onAccept && (
              <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            )}
            {onProposeAlternative && (
              <TouchableOpacity style={styles.alternativeButton} onPress={onProposeAlternative}>
                <Text style={styles.alternativeButtonText}>Suggest Alternative</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 4,
  },
  myContainer: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  otherContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  mapButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  alternativeButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  alternativeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});

