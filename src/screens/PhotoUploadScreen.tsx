import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
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
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // Get full quality first, we'll compress with ImageManipulator
      });

      if (!result.canceled && result.assets[0]) {
        // Compress and resize the image before setting it
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1024 } }], // Resize to max 1024px width (maintains aspect ratio)
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } // 80% quality JPEG
        );
        setPhoto(manipulatedImage.uri);
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
        quality: 1, // Get full quality first, we'll compress with ImageManipulator
      });

      if (!result.canceled && result.assets[0]) {
        // Compress and resize the image before setting it
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1024 } }], // Resize to max 1024px width (maintains aspect ratio)
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } // 80% quality JPEG
        );
        setPhoto(manipulatedImage.uri);
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
      // Prepare file for upload - React Native compatible approach
      // Note: Image is already compressed by expo-image-manipulator (max 1024px, 80% quality)
      console.log('[PhotoUpload] Preparing file for upload from URI:', photo);
      
      // Extract file extension
      const fileExt = photo.split('.').pop()?.toLowerCase() || 'jpg';
      
      // Ensure valid image extension
      const validExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'jpg';
      
      // Set content type correctly (jpg should be image/jpeg)
      const contentType = `image/${validExt === 'jpg' ? 'jpeg' : validExt}`;
      
      // Create unique filename based on user ID and timestamp
      const fileName = `${user.id}-${Date.now()}.${validExt}`;
      const filePath = fileName;
      
      // Use expo-file-system's new File class - works reliably in production builds
      console.log('[PhotoUpload] Creating File object from URI:', photo);
      
      // Create File object from URI
      const file = new File(photo);
      
      // Get the file content as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileSize = arrayBuffer.byteLength;
      
      console.log('[PhotoUpload] File read successfully, size:', fileSize, 'bytes');
      
      if (fileSize === 0) {
        throw new Error('Photo file is empty (0 bytes)');
      }
      
      if (fileSize < 100) {
        console.warn('[PhotoUpload] WARNING: File size is suspiciously small:', fileSize, 'bytes');
      }
      
      console.log('[PhotoUpload] ArrayBuffer prepared for upload:', {
        size: fileSize,
        type: contentType,
        extension: validExt,
      });
      
      const uploadData = arrayBuffer;

      // Delete existing photo if it exists (ignore errors)
      await supabase.storage
        .from('profile-photos')
        .remove([fileName])
        .catch(() => {}); // Ignore errors if file doesn't exist

      // Upload to Supabase Storage
      console.log('[PhotoUpload] Starting upload to Supabase Storage...');
      console.log('[PhotoUpload] File path:', filePath);
      console.log('[PhotoUpload] Content type:', contentType);
      
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, uploadData, {
          contentType: contentType,
          upsert: true,
        });

      console.log('[PhotoUpload] Upload result:', uploadResult);
      
      if (uploadError) {
        console.error('[PhotoUpload] Upload error:', uploadError);
        console.error('[PhotoUpload] Upload error details:', JSON.stringify(uploadError, null, 2));
        
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

      if (!uploadResult) {
        throw new Error('Upload succeeded but no result data returned');
      }

      // Get public URL using the upload result path (more reliable)
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(uploadResult.path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get photo URL');
      }

      const publicUrl = urlData.publicUrl;
      console.log('[PhotoUpload] Photo uploaded successfully');
      console.log('[PhotoUpload] Upload path:', uploadResult.path);
      console.log('[PhotoUpload] Public URL:', publicUrl);
      console.log('[PhotoUpload] File name:', fileName);

      // Update user profile with photo URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ photo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('[PhotoUpload] Update error:', updateError);
        throw updateError;
      }

      console.log('[PhotoUpload] Photo URL saved to database');
      uploadSucceeded = true;
      
      // Refresh user data - wait a bit to ensure database update is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify the user was updated BEFORE refreshing
      const { data: updatedUser } = await supabase
        .from('users')
        .select('photo_url')
        .eq('id', user.id)
        .single();
      
      console.log('[PhotoUpload] Verified photo URL in database:', updatedUser?.photo_url);
      
      // Now refresh user state
      await refreshUser();
      console.log('[PhotoUpload] User data refreshed');
      
      // Wait a bit more to ensure state propagates
      await new Promise(resolve => setTimeout(resolve, 300));

      // Navigate to next screen or back to profile
      if (editMode) {
        // In edit mode, go back which will trigger focus listener to refresh
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
            <Image 
              source={{ uri: photo }} 
              style={styles.photoPreview}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
            />
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

