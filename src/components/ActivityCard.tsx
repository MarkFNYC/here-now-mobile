import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface ActivityCardProps {
  id: string;
  title: string;
  activityType: string;
  locationName: string;
  startTime: string;
  endTime: string;
  hostName: string;
  participantCount: number;
  maxParticipants?: number | null;
  distanceKm: number;
  isStartingSoon?: boolean;
  isHost?: boolean;
  isJoined?: boolean;
  isAtCapacity?: boolean;
  isJoining?: boolean;
  onPress?: () => void;
  onJoin?: () => void;
}

export function ActivityCard({
  id,
  title,
  activityType,
  locationName,
  startTime,
  endTime,
  hostName,
  participantCount,
  maxParticipants,
  distanceKm,
  isStartingSoon,
  isHost,
  isJoined,
  isAtCapacity,
  isJoining,
  onPress,
  onJoin,
}: ActivityCardProps) {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / 60000);

      if (diffMinutes < 0) return 'Started';
      if (diffMinutes < 60) return `In ${diffMinutes} min`;
      if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        return `In ${hours} hr${hours === 1 ? '' : 's'}`;
      }
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header with Title and Badge */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {isStartingSoon && (
            <View style={styles.startingSoonBadge}>
              <Text style={styles.startingSoonText}>Starting soon</Text>
            </View>
          )}
        </View>
        <View style={styles.typeRow}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{activityType}</Text>
          </View>
          <Text style={styles.distance}>📍 {distanceKm.toFixed(1)} km</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>⏰</Text>
          <Text style={styles.detailText}>
            {formatTime(startTime)} - {formatTime(endTime)} • {formatDate(startTime)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{locationName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>👤</Text>
          <Text style={styles.detailText}>
            Host: {hostName} • {participantCount} {participantCount === 1 ? 'person' : 'people'} going
            {maxParticipants && ` (${maxParticipants} max)`}
          </Text>
        </View>
      </View>

      {/* Join Button */}
      {onJoin && (
        <View style={styles.actionContainer}>
          {isHost ? (
            <View style={[styles.statusButton, styles.hostButton]}>
              <Text style={styles.hostButtonText}>You're hosting</Text>
            </View>
          ) : isJoined ? (
            <View style={[styles.statusButton, styles.joinedButton]}>
              <Text style={styles.joinedButtonText}>✓ Waiting for host confirmation</Text>
            </View>
          ) : isAtCapacity ? (
            <View style={[styles.statusButton, styles.fullButton]}>
              <Text style={styles.fullButtonText}>Activity full</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
              onPress={onJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.joinButtonSpinner} />
                  <Text style={styles.joinButtonText}>Joining...</Text>
                </>
              ) : (
                <Text style={styles.joinButtonText}>Join activity</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  startingSoonBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  startingSoonText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeTag: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  typeText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
  },
  distance: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  joinButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonSpinner: {
    marginRight: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  hostButton: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  hostButtonText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
  },
  joinedButton: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  joinedButtonText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },
  fullButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  fullButtonText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
  },
});

