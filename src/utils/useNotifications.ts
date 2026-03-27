import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export function useNotifications() {
  const router = useRouter();
  const { client } = useAuth();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // Handle foreground notification
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
        const data = response.notification.request.content.data;
        
        // Mark as read if notificationId is present
        if (data?.notificationId && client) {
          try {
            await client.notifications.markAsRead(data.notificationId);
          } catch (e) {
            console.warn('Failed to mark push notification as read:', e);
          }
        }

        if (data?.rideId) {
          router.push(`/rides/${data.rideId}`);
        }
      });

      return () => {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      };
    } catch (e) {
      console.warn('Failed to register notification listeners:', e);
    }
  }, [client, router]);
}
