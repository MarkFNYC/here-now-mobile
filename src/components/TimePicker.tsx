import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

interface TimeData {
  type: 'time';
  iso_time: string; // ISO string
}

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (timeData: TimeData) => void;
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TimePicker({ visible, onClose, onSelect }: TimePickerProps) {
  const [customDate, setCustomDate] = useState(() => formatDateInput(new Date()));
  const [customTime, setCustomTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);

  const quickOptions = useMemo(
    () => [
      { label: 'In 30 minutes', date: minutesFromNow(30) },
      { label: 'In 1 hour', date: minutesFromNow(60) },
      { label: 'In 2 hours', date: minutesFromNow(120) },
    ],
    [visible]
  );

  const handleSelect = (date: Date) => {
    const iso = date.toISOString();
    onSelect({ type: 'time', iso_time: iso });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCustomDate(formatDateInput(new Date()));
    setCustomTime('18:00');
    setSubmitting(false);
  };

  const handleCustomSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!customDate || !customTime) {
        Alert.alert('Error', 'Please provide a date and time');
        return;
      }

      const [hourStr, minuteStr] = customTime.split(':');
      if (
        hourStr === undefined ||
        minuteStr === undefined ||
        Number.isNaN(Number(hourStr)) ||
        Number.isNaN(Number(minuteStr))
      ) {
        Alert.alert('Error', 'Time must be in HH:MM format');
        return;
      }

      const date = new Date(customDate);
      if (Number.isNaN(date.getTime())) {
        Alert.alert('Error', 'Invalid date format (YYYY-MM-DD)');
        return;
      }

      const hours = Number(hourStr);
      const minutes = Number(minuteStr);

      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        Alert.alert('Error', 'Time must be between 00:00 and 23:59');
        return;
      }

      date.setHours(hours, minutes, 0, 0);

      if (date.getTime() < Date.now()) {
        Alert.alert('Invalid Time', 'Please pick a time in the future.');
        return;
      }

      handleSelect(date);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!submitting) {
          resetForm();
          onClose();
        }
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Suggest Time</Text>
          <TouchableOpacity
            onPress={() => {
              if (!submitting) {
                resetForm();
                onClose();
              }
            }}
          >
            <Text style={styles.closeButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Quick Picks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Picks</Text>
            {quickOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickButton}
                onPress={() => handleSelect(option.date)}
              >
                <Text style={styles.quickLabel}>{option.label}</Text>
                <Text style={styles.quickSubtext}>
                  {option.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Time</Text>
            <Text style={styles.helperText}>Enter date and time (24-hour format)</Text>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={customDate}
              onChangeText={setCustomDate}
            />
            <Text style={styles.inputLabel}>Time</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor="#9ca3af"
              value={customTime}
              onChangeText={setCustomTime}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleCustomSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Suggest Time</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  quickSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

