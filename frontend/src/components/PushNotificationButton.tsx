"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush, requestNotificationPermission } from "@/lib/pushNotifications";

export default function PushNotificationButton() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }

    // Auto-request permission on first load
    const autoRequest = async () => {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        try {
          const sub = await subscribeToPush();
          if (sub) setSubscribed(true);
        } catch (err) {
          console.error("Auto subscribe failed", err);
        }
      }
    };

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
        if (!sub) {
          autoRequest();
        }
      });
    });
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const permitted = await requestNotificationPermission();
      if (!permitted) {
        alert("Notification permission denied");
        return;
      }
      const sub = await subscribeToPush();
      if (sub) {
        setSubscribed(true);
      }
    } catch (err) {
      console.error("Subscribe failed", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe failed", err);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={subscribed ? handleUnsubscribe : handleSubscribe}
      disabled={loading}
      className="fixed bottom-20 right-4 z-50 bg-brand-glow text-white p-3 rounded-full shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
      title={subscribed ? "Disable notifications" : "Enable notifications"}
    >
      {subscribed ? <BellOff size={20} /> : <Bell size={20} />}
    </button>
  );
}
