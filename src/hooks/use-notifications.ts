import { useCallback, useEffect, useState } from "react";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return null;
      }

      // Don't show notification if tab is focused
      if (document.hasFocus()) {
        return null;
      }

      const notification = new Notification(title, {
        icon: "/favicon.png",
        badge: "/favicon.png",
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    },
    [permission]
  );

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: "Notification" in window,
  };
};
