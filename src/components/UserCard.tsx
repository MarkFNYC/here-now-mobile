import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface UserCardProps {
  name: string;
  bio: string | null;
  activityTags: string[] | null;
  distance: number;
  photoUrl?: string | null;
  isPending?: boolean;
  onSayHi?: () => void;
  onPass?: () => void;
}

export function UserCard({ name, bio, activityTags, distance, photoUrl, isPending, onSayHi, onPass }: UserCardProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        {photoUrl ? (
          <Image 
            source={{ uri: photoUrl }} 
            style={styles.avatar}
            onError={(error) => {
              console.error('Error loading user photo:', error);
            }}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.distance}>📍 {distance.toFixed(1)} km away</Text>
        </View>
        <View style={styles.statusDot} />
      </View>

      {/* Activity Tags */}
      {activityTags && activityTags.length > 0 && (
        <View style={styles.tagsContainer}>
          {activityTags.slice(0, 4).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bio */}
      {bio && <Text style={styles.bio}>{bio}</Text>}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!isPending ? (
          <>
            <TouchableOpacity style={[styles.button, styles.passButton]} onPress={onPass}>
              <Text style={styles.passButtonText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.sayHiButton]} onPress={onSayHi}>
              <Text style={styles.sayHiButtonText}>Say Hi 👋</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={[styles.button, styles.pendingButton]}>
            <Text style={styles.pendingButtonText}>✓ Request Sent</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  distance: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  tagText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  passButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  sayHiButton: {
    backgroundColor: '#10b981',
  },
  sayHiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  pendingButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  pendingButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
});
