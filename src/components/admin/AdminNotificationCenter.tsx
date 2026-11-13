"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  Package,
  Sparkles,
  Star,
  Smartphone,
  ShieldAlert,
  Volume2,
} from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 7,200,000 ms (2 hours)
const LAST_CHECK_KEY = "drs_admin_last_notif_check";

export function AdminNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch unread count & notifications (strictly respects 2-hour interval)
  const fetchNotifications = async (force = false) => {
    try {
      const now = Date.now();
      const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);

      // Unless forced (e.g. user opens dropdown or enables notifications), strictly throttle to every 2 hours
      if (!force && now - lastCheck < TWO_HOURS_MS) {
        return;
      }

      localStorage.setItem(LAST_CHECK_KEY, String(now));
      const res = await fetch("/api/admin/notifications?limit=25");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchNotifications(true);

    // Schedule next check ONLY in 2 hours (no continuous requests to server)
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, TWO_HOURS_MS);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Subscribe to Mobile & Web Push
  const handleEnablePush = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported in this browser. Please use Chrome on Android or a modern desktop browser.");
      return;
    }

    setIsSubscribing(true);
    setStatusMessage("");

    try {
      // 1. Request Permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setStatusMessage("Notifications were denied. Please enable them in browser site settings.");
        setIsSubscribing(false);
        return;
      }

      // 2. Register Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // 3. Fetch VAPID Public Key
      const keyRes = await fetch("/api/admin/notifications/vapid-key");
      const keyData = await keyRes.json();
      if (!keyData.publicKey) throw new Error("Could not retrieve VAPID key");

      // 4. Create Push Subscription
      const convertedVapidKey = urlBase64ToUint8Array(keyData.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 5. Send subscription to server
      const subJson = subscription.toJSON();
      const saveRes = await fetch("/api/admin/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent,
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save subscription");

      // 6. Attempt Periodic Background Sync registration (for 2-hour checks)
      try {
        if ("periodicSync" in registration) {
          const status = await (navigator as any).permissions.query({ name: "periodic-background-sync" });
          if (status.state === "granted") {
            await (registration as any).periodicSync.register("check-admin-notifications", {
              minInterval: TWO_HOURS_MS,
            });
          }
        }
      } catch {
        // Periodic sync optional fallback
      }

      setStatusMessage("✅ Notifications active! You will receive alerts even when the browser is closed.");
    } catch (err: any) {
      console.error("[Subscribe Error]:", err);
      setStatusMessage("Failed to activate notifications: " + (err.message || "Unknown error"));
    } finally {
      setIsSubscribing(false);
    }
  };

  // Dispatch instant test notification to device
  const handleTestPush = async () => {
    setIsTesting(true);
    setStatusMessage("");
    try {
      const res = await fetch("/api/admin/notifications/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || "Test notification sent! Check your notification bar.");
      } else {
        setStatusMessage(data.message || data.error || "Failed to send test notification.");
      }
    } catch (err: any) {
      setStatusMessage("Error sending test: " + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch {
      // ignore
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="w-4 h-4 text-[#B84A67]" />;
      case "custom_request":
        return <Sparkles className="w-4 h-4 text-[#D4AF37]" />;
      case "review":
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#7A5E68]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) fetchNotifications(true);
        }}
        className="relative p-2 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
        title="Admin Notifications (Orders, Custom Inquiries, Reviews)"
        aria-label="Admin Notifications"
      >
        <Bell className="w-5 h-5 text-[#EFE5DC] hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#DF4C4C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#1F2421] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#191D1A] rounded-2xl shadow-2xl border border-[#E8E0D5] dark:border-[#333A35] z-50 overflow-hidden text-left animate-fadeIn">
          {/* Header */}
          <div className="p-3.5 bg-[#FAF0F3] dark:bg-[#252C27] border-b border-[#E8E0D5] dark:border-[#333A35] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-[#B84A67] dark:text-[#D4AF37]" />
              <h3 className="font-serif font-bold text-sm text-[#3A1823] dark:text-white">
                Studio Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#B84A67] text-white font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#8A6E78] dark:text-[#A69E96] hover:text-[#3A1823] dark:hover:text-white font-medium flex items-center space-x-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Mobile Push Notification Setup Banner */}
          <div className="p-3 bg-[#FCFAF8] dark:bg-[#1E2320] border-b border-[#E8E0D5] dark:border-[#333A35]">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#3A1823] dark:text-white">
                  <Smartphone className="w-3.5 h-3.5 text-[#B84A67] dark:text-[#D4AF37]" />
                  <span>Mobile Notification Bar Alerts</span>
                </div>
                <p className="text-[10.5px] text-[#7A5E68] dark:text-[#A69E96] leading-tight">
                  Receive native mobile alerts even when browser is closed. Checks every 2 hours without draining server or battery.
                </p>
              </div>

              {permission === "granted" ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center space-x-1 text-[10px] bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-semibold px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                  <button
                    onClick={handleTestPush}
                    disabled={isTesting}
                    className="text-[9.5px] text-[#B84A67] dark:text-[#D4AF37] hover:underline font-semibold flex items-center space-x-1"
                  >
                    {isTesting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Volume2 className="w-2.5 h-2.5" />}
                    <span>Test Device</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnablePush}
                  disabled={isSubscribing}
                  className="px-2.5 py-1.5 bg-[#3A1823] hover:bg-[#4E2230] text-white text-[10.5px] font-bold rounded-lg transition-colors flex items-center space-x-1 shrink-0 shadow-xs"
                >
                  {isSubscribing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Smartphone className="w-3 h-3" />
                  )}
                  <span>Enable Push</span>
                </button>
              )}
            </div>

            {statusMessage && (
              <div className="mt-2 text-[10px] p-1.5 bg-white dark:bg-[#252C27] rounded border border-[#E8E0D5] dark:border-[#333A35] text-[#3A1823] dark:text-[#EDE8E1]">
                {statusMessage}
              </div>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F2EAE5] dark:divide-[#2D3630]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#8A6E78] dark:text-[#A69E96] space-y-1">
                <Bell className="w-7 h-7 mx-auto opacity-30 text-[#3A1823] dark:text-white" />
                <p className="text-xs font-semibold">No notifications yet</p>
                <p className="text-[10px]">New orders, custom requests and reviews will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <a
                  key={notif.id}
                  href={notif.link || "/admin"}
                  onClick={() => setIsOpen(false)}
                  className={`block p-3 hover:bg-[#FAF5F7] dark:hover:bg-[#252C27] transition-colors ${
                    !notif.isRead ? "bg-[#FFF9FB] dark:bg-[#1F2622]" : ""
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-[#2C332D] border border-[#E8E0D5] dark:border-[#3A453E] shadow-2xs shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold truncate ${!notif.isRead ? "text-[#3A1823] dark:text-white" : "text-[#5C4A51] dark:text-[#C4BCB3]"}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#B84A67] shrink-0 ml-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#7A5E68] dark:text-[#A69E96] line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[9.5px] text-[#A69E96]">
                        <span>
                          {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[#B84A67] dark:text-[#D4AF37] font-semibold flex items-center space-x-0.5">
                          <span>View</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#FAF0F3] dark:bg-[#252C27] border-t border-[#E8E0D5] dark:border-[#333A35] text-center text-[10px] text-[#8A6E78] dark:text-[#A69E96]">
            Checked every 2 hours &bull; Push alerts active even when closed
          </div>
        </div>
      )}
    </div>
  );
}

