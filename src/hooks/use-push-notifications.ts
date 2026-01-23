import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

interface UsePushNotificationsReturn {
  isNative: boolean;
  token: string | null;
  isRegistered: boolean;
  registerPush: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();

  const registerPush = useCallback(async () => {
    if (!isNative) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Register with Apple/Google to get push token
      await PushNotifications.register();
      
    } catch (error) {
      console.error('Error registering push notifications:', error);
    }
  }, [isNative]);

  useEffect(() => {
    if (!isNative) return;

    // Handle registration success
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setToken(token.value);
      setIsRegistered(true);
      
      // Here you could save the token to your backend
      // to send targeted push notifications later
    });

    // Handle registration errors
    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Handle incoming push notifications when app is open
    const notificationListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        // You can show a local notification or update UI here
      }
    );

    // Handle push notification tap/action
    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);
        // Navigate to relevant screen based on notification data
        const data = notification.notification.data;
        if (data?.inboxUrl) {
          window.location.href = data.inboxUrl;
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      registrationListener.then(l => l.remove());
      errorListener.then(l => l.remove());
      notificationListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [isNative]);

  return {
    isNative,
    token,
    isRegistered,
    registerPush,
  };
};
