import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      } else {
        setNotifications(data ?? []);
      }
      setLoading(false);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => {
            const existingIndex = prev.findIndex((n) => n.id === (payload.new as any)?.id);
            switch (payload.eventType) {
              case 'INSERT':
                if (existingIndex === -1) {
                  return [payload.new as Notification, ...prev];
                }
                return prev;
              case 'UPDATE':
                if (existingIndex !== -1) {
                  const next = [...prev];
                  next[existingIndex] = payload.new as Notification;
                  return next;
                }
                return prev;
              case 'DELETE':
                return prev.filter((n) => n.id !== payload.old.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const requestNotifications = useMemo(
    () => notifications.filter((n) => n.type === 'request'),
    [notifications]
  );

  const unreadRequestCount = useMemo(
    () => requestNotifications.filter((n) => !n.is_read).length,
    [requestNotifications]
  );

  const latestRequestNotification = useMemo(() => requestNotifications[0] ?? null, [requestNotifications]);

  const markRequestNotificationsAsRead = useCallback(async () => {
    if (!user?.id || unreadRequestCount === 0) return;
    const ids = requestNotifications.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids);

    if (error) {
      console.error('Error marking notifications read:', error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
    );
  }, [user?.id, unreadRequestCount, requestNotifications]);

  return {
    notifications,
    requestNotifications,
    unreadRequestCount,
    latestRequestNotification,
    loading,
    markRequestNotificationsAsRead,
  };
}

