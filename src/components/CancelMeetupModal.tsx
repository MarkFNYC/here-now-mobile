import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';

interface CancelMeetupModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export function CancelMeetupModal({ visible, onClose, onConfirm, isSubmitting = false }: CancelMeetupModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) {
      setReason('');
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm(reason.trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cancel meetup</Text>
          <TouchableOpacity onPress={() => !isSubmitting && onClose()}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.prompt}>
            Let them know why you’re cancelling. This message will be shared so it feels respectful.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Optional reason (e.g. “Running late, can we reschedule?”)"
            placeholderTextColor="#9ca3af"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={200}
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>{isSubmitting ? 'Cancelling…' : 'Cancel meetup'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
          >
            <Text style={styles.backButtonText}>Go back</Text>
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
  prompt: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
  },
  input: {
    minHeight: 120,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

