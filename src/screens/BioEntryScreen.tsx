import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BioEntryScreenProps {
  navigation: any;
  route?: { params?: { editMode?: boolean } };
}

const MAX_BIO_LENGTH = 200;

export default function BioEntryScreen({ navigation, route }: BioEntryScreenProps) {
  const { user, refreshUser } = useAuth();
  const editMode = route?.params?.editMode || false;
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to continue');
      return;
    }

    // Bio is optional, but we'll save it if provided
    if (bio.trim().length > MAX_BIO_LENGTH) {
      Alert.alert('Error', `Bio must be ${MAX_BIO_LENGTH} characters or less`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: bio.trim() || null })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating bio:', error);
        throw error;
      }

      await refreshUser();

      if (editMode) {
        navigation.goBack();
      } else {
        navigation.navigate('ActivityTags');
      }
    } catch (error: any) {
      console.error('Error saving bio:', error);
      Alert.alert('Error', error.message || 'Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('ActivityTags');
  };

  const remainingChars = MAX_BIO_LENGTH - bio.length;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{editMode ? 'Edit Bio' : 'Tell Us About Yourself'}</Text>
          <Text style={styles.subtitle}>
            Write a short bio to help others get to know you
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="E.g., Love hiking, coffee, and meeting new people!"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={MAX_BIO_LENGTH}
              autoFocus
              editable={!saving}
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.charCount}>
              {remainingChars} characters remaining
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, saving && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>{editMode ? 'Save' : 'Continue'}</Text>
              )}
            </TouchableOpacity>

            {!editMode && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={saving}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
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
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 8,
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
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
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

