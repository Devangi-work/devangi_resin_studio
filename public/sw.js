// Devangi Resin Studio - Admin Mobile & Web Push Service Worker
// Handles background push events, 2-hour periodic sync, and notification bar clicks even when browser is closed.

const CACHE_NAME = 'drs-admin-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// -------------------------------------------------------------
// 1. Web Push Event Handler (Direct server-to-device push via FCM/APNs)
// -------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    data = {
      title: 'Devangi Resin Studio Admin',
      body: event.data ? event.data.text() : 'New activity in your studio.',
    };
  }

  const title = data.title || 'Devangi Resin Studio Admin';
  const targetUrl = data.url || '/admin';

  const notificationOptions = {
    body: data.body || 'New alert received in your studio.',
    icon: data.icon || '/images/logo/resin_logo.png',
    badge: data.badge || '/images/logo/resin_logo.png',
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || `drs-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl,
      timestamp: Date.now(),
      metadata: data.metadata || {},
    },
    actions: [
      { action: 'open', title: 'Open in Studio' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, notificationOptions));
});

// -------------------------------------------------------------
// 2. Notification Click Handler (Deep-links to relevant Admin Page)
// -------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If an admin tab is already open, navigate & focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// -------------------------------------------------------------
// 3. Periodic Background Sync (2-Hour Interval Check)
// Strictly checks every 2 hours only - no continuous requests to server.
// -------------------------------------------------------------
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-admin-notifications') {
    event.waitUntil(checkAdminUnreadNotifications());
  }
});

async function checkAdminUnreadNotifications() {
  try {
    const res = await fetch('/api/admin/notifications/unread-check', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) return;
    const json = await res.json();

    if (json.hasUnread && Array.isArray(json.notifications)) {
      for (const notif of json.notifications) {
        await self.registration.showNotification(notif.title, {
          body: notif.message,
          icon: '/images/logo/resin_logo.png',
          badge: '/images/logo/resin_logo.png',
          vibrate: [200, 100, 200],
          tag: `unread-${notif.id}`,
          renotify: true,
          data: {
            url: notif.link || '/admin',
          },
          actions: [
            { action: 'open', title: 'View Details' },
          ],
        });
      }
    }
  } catch (err) {
    // Network offline or error - silently ignore
  }
}

// -------------------------------------------------------------
// 4. Client Communication Listener
// -------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_2HR_CHECK') {
    event.waitUntil(checkAdminUnreadNotifications());
  }
});

