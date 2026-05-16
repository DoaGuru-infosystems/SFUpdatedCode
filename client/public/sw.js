/* eslint-disable no-restricted-globals */

// This service worker is responsible for showing notifications even when the tab is in the background.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  console.log("📡 Push event received in Service Worker");

  let pushData = {
    title: "DG Workspace 🏢",
    message: "New update in your workspace.",
    url: "/task/Admin-Home-page"
  };

  try {
    if (event.data) {
      const serverData = event.data.json();
      pushData = {
        ...pushData,
        ...serverData
      };
    }
  } catch (err) {
    console.error("❌ Error parsing push data:", err.message);
  }

  const options = {
    body: pushData.message || "You have a new work notification.",
    icon: 'https://doaguru.com/static/media/doagurulogo-removebg.b0126812bbe704a27f8f.webp',
    badge: 'https://doaguru.com/static/media/doagurulogo-removebg.b0126812bbe704a27f8f.webp',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: pushData.url || '/',
      type: pushData.type || 'general'
    },
    actions: [
      { action: 'open_url', title: '📂 Open Dashboard' },
      { action: 'close', title: '✖️ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  const notifData = event.notification.data;
  
  if (event.action === 'close') {
    event.notification.close();
    return;
  }

  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Determine the target URL based on notification type
      let targetPath = '/task/Admin-Home-page';
      if (notifData.type === 'leave') {
        targetPath = '/task/admin/employee-leave-report';
      } else if (notifData.type === 'login' || notifData.type === 'logout') {
        targetPath = '/task/admin/employee-attendance-report';
      } else if (notifData.type === 'task') {
        targetPath = '/task/Employee-report';
      }

      const targetUrl = new URL(targetPath, self.location.origin).href;

      // Check if there is already a window open
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window is open or no matching URL, open a new one or focus the first one and navigate
      if (clientList.length > 0) {
        let client = clientList[0];
        if ('navigate' in client) {
           client.navigate(targetUrl);
        }
        return client.focus();
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
