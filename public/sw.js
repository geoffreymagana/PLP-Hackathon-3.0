self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'PathFinder AI';
  const body = data.body || 'You have a new notification.';
  const icon = data.icon || '/icons/icon-96x96.png';
  const url = data.url || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      data: { url: url },
      tag: data.tag || 'default-tag'
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  // Safely get the URL with a fallback to the root
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
