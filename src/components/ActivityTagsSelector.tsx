import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AVAILABLE_TAGS = [
  'Coffee',
  'Walks',
  'Sport',
  'Food',
  'Drinks',
  'Creative',
  'Wellness',
  'Professional',
];

interface ActivityTagsSelectorProps {
  onClose: () => void;
}

export default function ActivityTagsSelector({ onClose }: ActivityTagsSelectorProps) {
  const { user, refreshUser } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>(user?.activity_tags || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Deselect tag
      const newTags = selectedTags.filter((t) => t !== tag);
      if (newTags.length < 1) {
        Alert.alert('Minimum Required', 'You must select at least 1 activity tag');
        return;
      }
      setSelectedTags(newTags);
    } else {
      // Select tag
      if (selectedTags.length >= 5) {
        Alert.alert('Maximum Reached', 'You can only select up to 5 activity tags');
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    if (selectedTags.length < 1) {
      Alert.alert('Error', 'Please select at least 1 activity tag');
      return;
    }

    if (selectedTags.length > 5) {
      Alert.alert('Error', 'You can only select up to 5 activity tags');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to update your tags');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ activity_tags: selectedTags })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating activity tags:', error);
        throw error;
      }

      // Reload user profile to get updated tags
      // The AuthContext should handle this, but we can trigger a refresh
      // Reload user profile to reflect changes
      await refreshUser();
      
      Alert.alert('Success', 'Activity tags updated successfully!', [
        {
          text: 'OK',
          onPress: onClose,
        },
      ]);
    } catch (error: any) {
      console.error('Error saving activity tags:', error);
      Alert.alert('Error', error.message || 'Failed to save activity tags');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Activity Tags</Text>
        <Text style={styles.subtitle}>
          Choose {selectedTags.length}/5 tags that interest you
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.tagsContainer}>
          {AVAILABLE_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, isSelected && styles.tagSelected]}
                onPress={() => toggleTag(tag)}
                disabled={loading || saving}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                  {tag}
                </Text>
                {isSelected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            • Select at least 1 tag (required){'\n'}
            • Maximum of 5 tags allowed{'\n'}
            • Tags help match you with like-minded neighbors
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelButton, (loading || saving) && styles.buttonDisabled]}
          onPress={onClose}
          disabled={loading || saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (loading || saving || selectedTags.length < 1) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={loading || saving || selectedTags.length < 1}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Tags</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 100,
    marginRight: 12,
    marginBottom: 12,
  },
  tagSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  tagText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tagTextSelected: {
    color: '#ffffff',
  },
  checkmark: {
    marginLeft: 8,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
