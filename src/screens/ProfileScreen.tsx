import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>?</Text>
            </View>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.name}>Your Profile</Text>
          <Text style={styles.location}>📍 Clapham</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Add your bio to let neighbors know more about you
            </Text>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERESTS</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Add your interests to find like-minded neighbors
            </Text>
          </View>
        </View>

        {/* Settings Button Placeholder */}
        <View style={styles.section}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </View>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Settings</Text>
          </View>
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
});
