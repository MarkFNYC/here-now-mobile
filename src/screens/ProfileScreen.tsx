import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import ActivityTagsSelector from '../components/ActivityTagsSelector';

export default function ProfileScreen({ navigation }: any) {
  const { signOut, user, refreshUser } = useAuth();
  const [showTagsSelector, setShowTagsSelector] = useState(false);

  // Refresh user data when screen comes into focus to ensure we have latest photo
  useEffect(() => {
    if (!navigation) return;
    
    const unsubscribe = navigation.addListener('focus', () => {
      // Only refresh when screen comes into focus, not on every render
      console.log('[ProfileScreen] Screen focused, refreshing user data...');
      refreshUser();
    });
    
    return unsubscribe;
  }, [navigation]); // Remove refreshUser from deps to avoid recreating listener

  // Debug: Log photo URL and user state changes
  useEffect(() => {
    console.log('[ProfileScreen] User state changed:', {
      hasUser: !!user,
      hasPhotoUrl: !!user?.photo_url,
      photoUrl: user?.photo_url,
      userId: user?.id,
      fullName: user?.full_name
    });
    
    if (user?.photo_url) {
      console.log('[ProfileScreen] Photo URL:', user.photo_url);
      // Test if URL is accessible
      fetch(user.photo_url, { method: 'HEAD' })
        .then(response => {
          console.log('[ProfileScreen] Photo URL accessibility check:', {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type')
          });
        })
        .catch(error => {
          console.error('[ProfileScreen] Photo URL not accessible:', error);
        });
    } else {
      console.log('[ProfileScreen] No photo URL found');
    }
  }, [user?.photo_url, user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show tags selector as a modal-style overlay
  if (showTagsSelector) {
    return (
      <ActivityTagsSelector
        onClose={() => setShowTagsSelector(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.photo_url ? (
              <Image 
                key={user.photo_url} // Force re-render when URL changes
                source={{ uri: user.photo_url }} 
                style={styles.avatar}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
                onError={(error) => {
                  console.error('[ProfileScreen] Error loading profile photo:', error);
                  console.error('[ProfileScreen] Photo URL was:', user.photo_url);
                }}
                onLoad={() => {
                  console.log('[ProfileScreen] Photo loaded successfully:', user.photo_url);
                }}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>?</Text>
              </View>
            )}
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.name}>{user?.full_name || 'Your Profile'}</Text>
          <Text style={styles.location}>📍 {user?.neighbourhood || 'Clapham'}</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardText}>
              {user?.bio || 'Add your bio to let neighbors know more about you'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERESTS</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setShowTagsSelector(true)}
          >
            {user?.activity_tags?.length ? (
              <View style={styles.tagsDisplay}>
                {user.activity_tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.cardText}>
                Add your interests to find like-minded neighbors
              </Text>
            )}
            <Text style={styles.editHint}>Tap to edit</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EDIT PROFILE</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation?.navigate('EditPhoto', { editMode: true })}
          >
            <Text style={styles.cardLabel}>Change Photo</Text>
            <Text style={styles.editHint}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, { marginTop: 8 }]}
            onPress={() => navigation?.navigate('EditBio', { editMode: true })}
          >
            <Text style={styles.cardLabel}>Edit Bio</Text>
            <Text style={styles.editHint}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, { marginTop: 8 }]}
            onPress={() => navigation?.navigate('EditName', { editMode: true })}
          >
            <Text style={styles.cardLabel}>Edit Name</Text>
            <Text style={styles.editHint}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, { marginTop: 8 }]}
            onPress={() => navigation?.navigate('EditNeighbourhood', { editMode: true })}
          >
            <Text style={styles.cardLabel}>Edit Neighbourhood</Text>
            <Text style={styles.editHint}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation?.navigate('NotificationSettings')}
          >
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={[styles.buttonText, styles.signOutButtonText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  profileCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#6b7280',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  cardLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagChip: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  editHint: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 8,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: 8,
    borderColor: '#ef4444',
  },
  signOutButtonText: {
    color: '#ef4444',
  },
});
