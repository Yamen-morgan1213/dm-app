/**
 * Helper to request notification permissions
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return Notification.permission === 'granted';
};

/**
 * Helper to display a system notification
 */
export const triggerLocalNotification = (title, body, url) => {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    // Try to send via active Service Worker (for native PWA system notification styling)
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          icon: '/icon-192.png',
          url: url || window.location.href
        });
      }).catch(() => {
        // Fallback to standard browser notification
        new Notification(title, {
          body,
          icon: '/icon-192.png'
        });
      });
    } else {
      // Fallback if Service Worker is not ready
      new Notification(title, {
        body,
        icon: '/icon-192.png'
      });
    }
  }
};
