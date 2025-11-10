import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TimeData {
  type: 'time';
  iso_time: string;
}

interface TimeMessageCardProps {
  timeData: TimeData;
  isMe: boolean;
  status?: 'pending' | 'accepted';
  onAccept?: () => void;
  onProposeAlternative?: () => void;
}

function formatAbsoluteTime(date: Date) {
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(date: Date) {
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 1) return 'In 1 minute';
  if (diffMinutes < 60) return `In ${diffMinutes} minutes`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `In ${diffHours} hour${diffHours === 1 ? '' : 's'}`;

  const diffDays = Math.round(diffHours / 24);
  return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

export function TimeMessageCard({ timeData, isMe, status = 'pending', onAccept, onProposeAlternative }: TimeMessageCardProps) {
  const date = new Date(timeData.iso_time);

  return (
    <View style={[styles.container, isMe ? styles.myContainer : styles.otherContainer]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⏰</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Suggested Time</Text>
        <Text style={styles.relativeText}>{formatRelativeTime(date)}</Text>
        <Text style={styles.absoluteText}>{formatAbsoluteTime(date)}</Text>

        {status === 'accepted' && (
          <View style={styles.statusTag}>
            <Text style={styles.statusTagText}>Accepted ✅</Text>
          </View>
        )}

        {status === 'pending' && !isMe && (
          <View style={styles.actionButtons}>
            {onAccept && (
              <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            )}
            {onProposeAlternative && (
              <TouchableOpacity style={styles.alternativeButton} onPress={onProposeAlternative}>
                <Text style={styles.alternativeButtonText}>Suggest Alternative</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 4,
  },
  myContainer: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  otherContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  relativeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  absoluteText: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusTag: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusTagText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  alternativeButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  alternativeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});

