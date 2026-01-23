import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

interface UsePushNotificationsReturn {
  isNative: boolean;
  token: string | null;
  isRegistered: boolean;
  registerPush: (aliasId?: string) => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [pendingAliasId, setPendingAliasId] = useState<string | null>(null);
  
  const isNative = Capacitor.isNativePlatform();

  // Register token with backend
  const registerTokenWithBackend = useCallback(async (fcmToken: string, aliasId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('register-push-token', {
        body: {
          alias_id: aliasId,
          fcm_token: fcmToken,
          device_info: `${Capacitor.getPlatform()} - ${navigator.userAgent}`,
        },
      });

      if (error) {
        console.error('Failed to register token with backend:', error);
        return false;
      }

      console.log('Token registered with backend:', data);
      return true;
    } catch (err) {
      console.error('Error registering token:', err);
      return false;
    }
  }, []);

  const registerPush = useCallback(async (aliasId?: string) => {
    if (!isNative) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    if (aliasId) {
      setPendingAliasId(aliasId);
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
    const registrationListener = PushNotifications.addListener('registration', async (tokenData: Token) => {
      console.log('Push registration success, token:', tokenData.value);
      setToken(tokenData.value);
      setIsRegistered(true);
      
      // Register with backend if we have an alias ID
      if (pendingAliasId) {
        await registerTokenWithBackend(tokenData.value, pendingAliasId);
      }
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
  }, [isNative, pendingAliasId, registerTokenWithBackend]);

  // Re-register token when alias changes
  useEffect(() => {
    if (token && pendingAliasId) {
      registerTokenWithBackend(token, pendingAliasId);
    }
  }, [token, pendingAliasId, registerTokenWithBackend]);

  return {
    isNative,
    token,
    isRegistered,
    registerPush,
  };
};
