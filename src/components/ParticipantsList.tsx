import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ParticipantCard } from './ParticipantCard';

interface Participant {
  id: string;
  connection_id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  neighbourhood: string | null;
  status: 'pending' | 'accepted';
  created_at: string;
}

interface ParticipantsListProps {
  participants: Participant[];
  isHost: boolean;
  onParticipantPress?: (participant: Participant) => void;
  onAccept?: (connectionId: string) => void;
  onDecline?: (connectionId: string) => void;
  processingConnectionId?: string | null;
}

export function ParticipantsList({
  participants,
  isHost,
  onParticipantPress,
  onAccept,
  onDecline,
  processingConnectionId,
}: ParticipantsListProps) {
  const going = participants.filter((p) => p.status === 'accepted');
  const waiting = participants.filter((p) => p.status === 'pending');

  return (
    <View style={styles.container}>
      {/* Going Section */}
      {going.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Going ({going.length})</Text>
          </View>
          <ScrollView style={styles.list} nestedScrollEnabled>
            {going.map((participant) => (
              <ParticipantCard
                key={participant.connection_id}
                participant={participant}
                isHost={isHost}
                onPress={() => onParticipantPress?.(participant)}
                isProcessing={processingConnectionId === participant.connection_id}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Waiting Section */}
      {waiting.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Waiting ({waiting.length})</Text>
            {isHost && (
              <Text style={styles.sectionSubtitle}>Tap to view profile</Text>
            )}
          </View>
          <ScrollView style={styles.list} nestedScrollEnabled>
            {waiting.map((participant) => (
              <ParticipantCard
                key={participant.connection_id}
                participant={participant}
                isHost={isHost}
                onPress={() => onParticipantPress?.(participant)}
                onAccept={onAccept}
                onDecline={onDecline}
                isProcessing={processingConnectionId === participant.connection_id}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Empty State */}
      {going.length === 0 && waiting.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>No participants yet</Text>
          <Text style={styles.emptySubtext}>
            People who join will appear here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  list: {
    maxHeight: 400,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});




