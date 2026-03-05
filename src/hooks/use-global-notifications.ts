import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSound } from "./use-notification-sound";
import { cleanSenderEmail } from "@/lib/clean-sender";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseGlobalNotificationsOptions {
  userId: string | null;
  enabled: boolean;
}

export const useGlobalNotifications = ({ userId, enabled }: UseGlobalNotificationsOptions) => {
  const { playSound, soundEnabled, toggleSound } = useNotificationSound();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const aliasIdsRef = useRef<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    return result === "granted";
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string, tag?: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (document.hasFocus()) return; // Don't show if tab is focused
    
    const notification = new Notification(title, {
      body,
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: tag || `email-${Date.now()}`,
      silent: false,
    });

    setTimeout(() => notification.close(), 8000);
    return notification;
  }, []);

  // Load user's alias IDs and subscribe to realtime
  useEffect(() => {
    if (!userId || !enabled) {
      // Cleanup if disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const setup = async () => {
      // Fetch all aliases owned by this user
      const { data: aliases } = await supabase
        .from("email_aliases")
        .select("id")
        .eq("user_id", userId);

      if (cancelled) return;

      const ids = new Set((aliases || []).map(a => a.id));
      aliasIdsRef.current = ids;

      if (ids.size === 0) return;

      // Remove existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Subscribe to new emails for all user aliases
      const channel = supabase
        .channel(`global-emails-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "received_emails",
          },
          (payload) => {
            const newEmail = payload.new as any;
            // Only notify if this email belongs to one of the user's aliases
            if (!aliasIdsRef.current.has(newEmail.alias_id)) return;

            // Play notification sound
            playSound();

            // Show browser notification
            const sender = cleanSenderEmail(newEmail.from_email || "Unknown");
            const subject = newEmail.subject || "(No subject)";
            showNotification(
              `New email from ${sender}`,
              subject,
              `email-${newEmail.id}`
            );
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    // Request notification permission on setup
    if ("Notification" in window && Notification.permission === "default") {
      requestPermission();
    } else if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    setup();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, playSound, showNotification, requestPermission]);

  // Re-fetch aliases periodically (every 5 min) to catch new inboxes
  useEffect(() => {
    if (!userId || !enabled) return;

    const interval = setInterval(async () => {
      const { data: aliases } = await supabase
        .from("email_aliases")
        .select("id")
        .eq("user_id", userId);
      aliasIdsRef.current = new Set((aliases || []).map(a => a.id));
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, enabled]);

  return {
    notificationPermission,
    requestPermission,
    soundEnabled,
    toggleSound,
  };
};
