self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data?.json() ?? {
      title: 'New Notification',
      body: 'You have a new notification.',
      icon: '/icons/icon-512x512.png'
    };
  } catch (e) {
    data = {
      title: event.data?.text() ?? 'New Notification',
      body: 'You have a new notification.',
      icon: '/icons/icon-512x512.png'
    };
  }

  const baseUrl = self.location.origin;
  const options = {
    body: data.body,
    icon: `${baseUrl}/icons/icon-512x512.png`,
    badge: `${baseUrl}/icons/icon-72x72.png`,
    image: `${baseUrl}/icons/icon-512x512.png`,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    silent: false,
    renotify: true,
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: `${baseUrl}/icons/icon-96x96.png`
      }
    ],
    dir: 'auto',
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(c => c.navigate(urlToOpen));
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
