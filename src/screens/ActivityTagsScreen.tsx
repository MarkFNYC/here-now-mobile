import React, { useState } from 'react';
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

interface ActivityTagsScreenProps {
  navigation: any;
}

const AVAILABLE_TAGS = [
  'Coffee',
  'Drinks',
  'Walks',
  'Sports',
  'Food',
  'Games',
];

export default function ActivityTagsScreen({ navigation }: ActivityTagsScreenProps) {
  const { user, refreshUser } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>(user?.activity_tags || []);
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Deselect tag
      const newTags = selectedTags.filter((t) => t !== tag);
      setSelectedTags(newTags);
    } else {
      // Select tag
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to continue');
      return;
    }

    if (selectedTags.length < 1) {
      Alert.alert('Required', 'Please select at least 1 activity tag');
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

      await refreshUser();
      navigation.navigate('Neighbourhood');
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
          Choose activities you're interested in
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
                disabled={saving}
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
            • Tags help match you with like-minded neighbors
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (saving || selectedTags.length < 1) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={saving || selectedTags.length < 1}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
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
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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

