// public/sw.js — MyTara PWA Service Worker with Push Notifications & Android Lockscreen Alerts

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching to avoid stale app issues.
  return;
});

// ── Web Push Notification Handler (Android & Desktop) ──
self.addEventListener('push', function (event) {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: '🛎️ Notifikasi MyTara CRS', body: event.data.text() };
  }

  const title = payload.title || '🛎️ Notifikasi Reservasi MyTara';
  const isCancel = payload.type === 'booking_cancelled';

  const options = {
    body: payload.body || 'Ada pembaruan status reservasi kamar di channel manager.',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-192x192.png',
    // Pola Getar Android: Membangunkan getar HP meskipun layar mati
    vibrate: isCancel ? [300, 150, 300, 150, 600] : [200, 100, 200, 100, 400],
    tag: payload.tag || 'crs-reservation-alert',
    renotify: true,
    requireInteraction: true, // Pop-up tetap bertahan di layar sampai direspons oleh staf
    data: {
      url: payload.url || '/channel-manager?tab=logs',
      bookingId: payload.bookingId,
      timestamp: payload.timestamp || Date.now(),
    },
    actions: [
      { action: 'open', title: '👁️ Buka Reservasi' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification Click Handler ──
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/channel-manager?tab=logs';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});