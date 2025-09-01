// Extend NotificationOptions to include additional properties
interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
}

export async function testNotificationWithIcons() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  let permission = Notification.permission;
  
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  
  if (permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  const originUrl = window.location.origin;
  const iconUrl = `${originUrl}/icons/icon-512x512.png`;
  const badgeUrl = `${originUrl}/icons/icon-72x72.png`;

  // First, verify the icons are accessible
  try {
    const [iconResponse, badgeResponse] = await Promise.all([
      fetch(iconUrl),
      fetch(badgeUrl)
    ]);

    if (!iconResponse.ok) {
      console.error('Icon not accessible:', iconUrl);
      return;
    }
    if (!badgeResponse.ok) {
      console.error('Badge not accessible:', badgeUrl);
      return;
    }
  } catch (error) {
    console.error('Error checking icon accessibility:', error);
    return;
  }

  const notificationOptions: ExtendedNotificationOptions = {
    body: 'Testing notification with icons',
    icon: iconUrl,
    badge: badgeUrl,
    image: iconUrl,
    requireInteraction: true,
    vibrate: [100, 50, 100],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Try service worker notification first
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Notification', notificationOptions);
      console.log('Service Worker notification sent with icons');
    } catch (error) {
      console.error('Service Worker notification failed:', error);
      
      // Fallback to regular notification
      new Notification('Test Notification', {
        ...notificationOptions,
        body: 'Testing notification with icons (fallback)'
      });
      console.log('Fallback notification sent');
    }
  } else {
    // Regular notification if service worker is not available
    new Notification('Test Notification', {
      ...notificationOptions,
      body: 'Testing notification with icons (direct)'
    });
    console.log('Direct notification sent');
  }
}
