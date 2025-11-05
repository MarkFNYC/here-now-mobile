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

interface NeighbourhoodScreenProps {
  navigation: any;
  route?: { params?: { editMode?: boolean } };
}

export default function NeighbourhoodScreen({ navigation, route }: NeighbourhoodScreenProps) {
  const { user, refreshUser } = useAuth();
  const editMode = route?.params?.editMode || false;
  const [neighbourhood, setNeighbourhood] = useState(user?.neighbourhood || '');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to continue');
      return;
    }

    if (!neighbourhood.trim()) {
      Alert.alert('Required', 'Please enter your neighbourhood');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ neighbourhood: neighbourhood.trim() })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating neighbourhood:', error);
        throw error;
      }

      await refreshUser();

      // In edit mode, go back to profile. Otherwise, profile creation complete
      if (editMode) {
        navigation.goBack();
      }
      // If not edit mode, App.tsx will automatically route to MainNavigator
      // based on isProfileComplete() check
    } catch (error: any) {
      console.error('Error saving neighbourhood:', error);
      Alert.alert('Error', error.message || 'Failed to save neighbourhood');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{editMode ? 'Edit Neighbourhood' : 'Your Neighbourhood'}</Text>
          <Text style={styles.subtitle}>
            Enter your neighbourhood to help us show you nearby activities
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="E.g., Downtown, Midtown, Oak Park"
              value={neighbourhood}
              onChangeText={setNeighbourhood}
              autoCapitalize="words"
              editable={!saving}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, saving && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={saving || !neighbourhood.trim()}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>{editMode ? 'Save' : 'Complete Profile'}</Text>
              )}
            </TouchableOpacity>
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
});

