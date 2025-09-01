// A simple client-side service to handle sending local push notifications.
// In a real-world app, this would be handled by a backend service that
// sends pushes to the browser's push service.

/**
 * Sends a push notification if the user has granted permission.
 * @param title The title of the notification.
 * @param options The body and other options for the notification.
 */
// Extend NotificationOptions to include additional properties
interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
}

async function sendNotification(title: string, options: ExtendedNotificationOptions) {
  if (typeof window === 'undefined') return;

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  // Handle permission
  let permission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return;
    }
  }

  if (permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  try {
    const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const notificationOptions: ExtendedNotificationOptions = {
      icon: `${originUrl}/icons/icon-512x512.png`,
      badge: `${originUrl}/icons/icon-72x72.png`,
      image: `${originUrl}/icons/icon-512x512.png`,
      requireInteraction: true,
      ...options,
    };

    // Try service worker first
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to regular notifications
      new Notification(title, notificationOptions);
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// --- Specific Notification Triggers ---

export async function sendModuleCompletionNotification(moduleName: string, career: string) {
    await sendNotification('Module Completed!', {
        body: `Great job! You've completed the "${moduleName}" module for your ${career} path.`,
        data: { url: '/progress' },
        tag: 'module-completion'
    });
}

export async function sendPaymentNotification(planName: string) {
    await sendNotification('Payment Successful!', {
        body: `Your payment for the ${planName} was successful. Welcome aboard!`,
        data: { url: '/settings' },
        tag: 'payment-success'
    });
}

export async function sendNewMessageNotification() {
    await sendNotification('New Message from Your AI Coach', {
        body: 'Your AI career coach has sent you a new message. Check it out!',
        data: { url: '/check-in' },
        tag: 'new-message'
    });
}

export async function sendInactivityReminder() {
    await sendNotification("Don't Lose Your Momentum!", {
        body: "It's been a while. Keep making progress on your learning journey!",
        data: { url: '/my-roadmaps' },
        tag: 'inactivity-reminder'
    });
}

export async function sendWeeklyInsightNotification() {
    await sendNotification('Your Weekly Career Insight Is Here!', {
        body: 'Check out the latest trends and opportunities in your field.',
        data: { url: '/explore' },
        tag: 'weekly-insight'
    });
}
