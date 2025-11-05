import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PhotoUploadScreenProps {
  navigation: any;
  route?: { params?: { editMode?: boolean } };
}

export default function PhotoUploadScreen({ navigation, route }: PhotoUploadScreenProps) {
  const { user, refreshUser } = useAuth();
  const editMode = route?.params?.editMode || false;
  const [photo, setPhoto] = useState<string | null>(user?.photo_url || null);
  const [newPhotoSelected, setNewPhotoSelected] = useState(false);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need camera and photo library access to upload your profile photo.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // Use string value instead of deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Compress to reduce file size (0.7 = 70% quality, good balance)
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        setNewPhotoSelected(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Compress to reduce file size (0.7 = 70% quality, good balance)
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        setNewPhotoSelected(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadPhoto = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    // In edit mode, if no new photo was selected, just go back
    if (editMode && !newPhotoSelected) {
      navigation.goBack();
      return;
    }

    if (!photo) {
      Alert.alert('Error', 'Please select a photo first');
      return;
    }

    setUploading(true);
    let uploadSucceeded = false;

    try {
      // Convert image URI to blob
      const response = await fetch(photo);
      const blob = await response.blob();

      // Check file size (Supabase Storage typically has a 50MB limit, but we'll limit to 10MB for profile photos)
      const fileSizeMB = blob.size / (1024 * 1024);
      const maxSizeMB = 10;
      
      if (fileSizeMB > maxSizeMB) {
        Alert.alert(
          'File Too Large',
          `Photo is ${fileSizeMB.toFixed(1)}MB. Please choose a smaller image (under ${maxSizeMB}MB). The image will be compressed automatically.`,
          [
            {
              text: 'Choose Different Photo',
              style: 'cancel',
              onPress: () => {
                setUploading(false);
              },
            },
            {
              text: 'Skip Photo',
              onPress: () => {
                setUploading(false);
                navigation.navigate('BioEntry');
              },
            },
          ]
        );
        setUploading(false);
        return;
      }

      // Log file size for debugging
      console.log(`[PhotoUpload] File size: ${fileSizeMB.toFixed(2)}MB, format: ${blob.type}`);

      // Create a consistent filename based on user ID (allows replacing existing photo)
      // Extract file extension from the URI or default to jpg
      let fileExt = 'jpg';
      const uriParts = photo.split('.');
      if (uriParts.length > 1) {
        fileExt = uriParts.pop()?.toLowerCase() || 'jpg';
      }
      
      // Ensure valid image extension (JPEG, PNG, WebP are all supported)
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        fileExt = 'jpg';
      }
      
      const fileName = `${user.id}.${fileExt}`;
      const filePath = fileName; // Don't include bucket name in path - bucket is already specified in .from()

      // Delete existing photo if it exists (ignore errors)
      await supabase.storage
        .from('profile-photos')
        .remove([fileName])
        .catch(() => {}); // Ignore errors if file doesn't exist

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, blob, {
          contentType: fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        
        // Check if it's an RLS policy error
        if (uploadError.message?.includes('row-level security') || 
            uploadError.message?.includes('RLS') ||
            uploadError.message?.includes('policy')) {
          Alert.alert(
            'Storage Permission Required',
            'Photo upload requires storage bucket permissions. This is a configuration issue. Please skip for now and add a photo later, or contact support.\n\nJPEGs, PNGs, and WebP files up to 10MB are supported.',
            [
              {
                text: 'Continue Anyway',
                onPress: () => {
                  navigation.navigate('BioEntry');
                },
              },
              {
                text: 'Try Again',
                style: 'cancel',
              },
            ]
          );
          setUploading(false);
          return;
        }
        
        // Check for file size errors
        if (uploadError.message?.includes('size') || uploadError.message?.includes('too large')) {
          Alert.alert(
            'File Too Large',
            'The photo is too large. Please try a smaller image. JPEGs are recommended and work best.',
            [
              {
                text: 'Continue Without Photo',
                onPress: () => {
                  navigation.navigate('BioEntry');
                },
              },
              {
                text: 'Try Again',
                style: 'cancel',
              },
            ]
          );
          setUploading(false);
          return;
        }
        
        throw uploadError;
      }

      // Get public URL (use fileName, not filePath since filePath includes bucket name)
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get photo URL');
      }

      // Add cache-busting timestamp to force browser to reload the image
      const photoUrlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update user profile with photo URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ photo_url: photoUrlWithTimestamp })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      uploadSucceeded = true;
      // Refresh user data
      await refreshUser();

      // Navigate to next screen or back to profile
      if (editMode) {
        navigation.goBack();
      } else {
        navigation.navigate('BioEntry');
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      
      // Allow user to continue even if upload fails
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload photo. You can add a photo later in your profile settings.',
        [
          {
            text: 'Continue Anyway',
            onPress: () => {
              navigation.navigate('BioEntry');
            },
          },
          {
            text: 'Try Again',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('BioEntry');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{editMode ? 'Change Photo' : 'Add Your Photo'}</Text>
        <Text style={styles.subtitle}>
          Help others recognize you with a profile photo
        </Text>
        <Text style={styles.formatInfo}>
          JPEG, PNG, or WebP (up to 10MB)
        </Text>

        <View style={styles.photoContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>No photo selected</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={styles.secondaryButtonText}>Choose from Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={takePhoto}
            disabled={uploading}
          >
            <Text style={styles.secondaryButtonText}>Take Photo</Text>
          </TouchableOpacity>

          {(photo || editMode) && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, uploading && styles.buttonDisabled]}
              onPress={uploadPhoto}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {editMode ? (newPhotoSelected ? 'Save' : 'Done') : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {!editMode && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={uploading}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  formatInfo: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 40,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e5e7eb',
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

