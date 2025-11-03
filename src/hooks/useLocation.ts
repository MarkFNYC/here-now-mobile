import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

// Check if running in web browser
const isWeb = typeof window !== 'undefined' && typeof window.navigator !== 'undefined';

export function useLocation() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  async function requestLocation() {
    try {
      setLoading(true);
      setError(null);

      if (isWeb && navigator.geolocation) {
        // Use browser geolocation API
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLoading(false);
          },
          (err) => {
            setError(err.message || 'Failed to get location');
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        // Use Expo Location for native
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      setLoading(false);
    }
  }

  return {
    location,
    loading,
    error,
    refresh: requestLocation,
  };
}
