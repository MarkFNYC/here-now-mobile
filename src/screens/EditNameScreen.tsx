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

interface EditNameScreenProps {
  navigation: any;
  route?: { params?: { editMode?: boolean } };
}

export default function EditNameScreen({ navigation, route }: EditNameScreenProps) {
  const { user, refreshUser } = useAuth();
  const editMode = route?.params?.editMode || false;
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to continue');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    if (fullName.trim().length > 50) {
      Alert.alert('Error', 'Name must be 50 characters or less');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating name:', error);
        throw error;
      }

      await refreshUser();

      if (editMode) {
        navigation.goBack();
      } else {
        // If not edit mode, navigate to next step in profile creation
        navigation.navigate('PhotoUpload');
      }
    } catch (error: any) {
      console.error('Error saving name:', error);
      Alert.alert('Error', error.message || 'Failed to save name');
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
          <Text style={styles.title}>{editMode ? 'Edit Name' : 'What\'s Your Name?'}</Text>
          <Text style={styles.subtitle}>
            {editMode 
              ? 'Update your display name'
              : 'This is how others will see you on the app'
            }
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoFocus
              editable={!saving}
              maxLength={50}
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.charCount}>
              {fullName.length}/50 characters
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>{editMode ? 'Save' : 'Continue'}</Text>
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
});



