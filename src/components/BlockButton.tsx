import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BlockButtonProps {
  userId: string;
  userName: string;
  onBlocked?: () => void;
  variant?: 'default' | 'danger';
}

export function BlockButton({ 
  userId, 
  userName, 
  onBlocked,
  variant = 'default' 
}: BlockButtonProps) {
  const { user: currentUser } = useAuth();
  const [blocking, setBlocking] = useState(false);

  const handleBlock = () => {
    if (!currentUser) return;

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName}? You won't be able to see each other or send messages.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await performBlock();
          },
        },
      ]
    );
  };

  const performBlock = async () => {
    if (!currentUser) return;

    setBlocking(true);
    try {
      // Get current blocked list
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('blocked_user_ids')
        .eq('id', currentUser.id)
        .single();

      if (fetchError) throw fetchError;

      const currentBlocked = userData?.blocked_user_ids || [];
      
      // Add user to blocked list if not already blocked
      if (!currentBlocked.includes(userId)) {
        const updatedBlocked = [...currentBlocked, userId];

        const { error: updateError } = await supabase
          .from('users')
          .update({ blocked_user_ids: updatedBlocked })
          .eq('id', currentUser.id);

        if (updateError) throw updateError;

        // Cancel any active connections between these two users
        // Cancel connections where current user is requester and blocked user is target
        await supabase
          .from('connections')
          .update({ status: 'cancelled' })
          .eq('requester_id', currentUser.id)
          .eq('target_id', userId)
          .in('status', ['pending', 'accepted']);
        
        // Cancel connections where blocked user is requester and current user is target
        await supabase
          .from('connections')
          .update({ status: 'cancelled' })
          .eq('requester_id', userId)
          .eq('target_id', currentUser.id)
          .in('status', ['pending', 'accepted']);

        Alert.alert(
          'User Blocked',
          `${userName} has been blocked. You won't see each other in the app.`,
          [{ text: 'OK', onPress: () => onBlocked?.() }]
        );
      } else {
        Alert.alert('Already Blocked', 'This user is already blocked.');
      }
    } catch (error: any) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={handleBlock}
        disabled={blocking}
      >
        {blocking ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.dangerButtonText}>Block User</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.defaultButton]}
      onPress={handleBlock}
      disabled={blocking}
    >
      {blocking ? (
        <ActivityIndicator color="#ef4444" size="small" />
      ) : (
        <Text style={styles.defaultButtonText}>Block</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  defaultButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  defaultButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

