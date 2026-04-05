type NotificationEvent = {
  type: 'notification.created' | 'notification.updated' | 'notifications.all_read';
  notification?: unknown;
  notificationId?: string;
};

type Listener = (event: NotificationEvent) => void;

const globalForRealtime = globalThis as typeof globalThis & {
  __noticeboardRealtime?: Map<string, Set<Listener>>;
};

const listeners = globalForRealtime.__noticeboardRealtime ?? new Map<string, Set<Listener>>();

if (!globalForRealtime.__noticeboardRealtime) {
  globalForRealtime.__noticeboardRealtime = listeners;
}

export function subscribeToUserNotifications(userId: string, listener: Listener) {
  const bucket = listeners.get(userId) ?? new Set<Listener>();
  bucket.add(listener);
  listeners.set(userId, bucket);

  return () => {
    const activeBucket = listeners.get(userId);
    if (!activeBucket) {
      return;
    }

    activeBucket.delete(listener);
    if (activeBucket.size === 0) {
      listeners.delete(userId);
    }
  };
}

export function publishToUserNotifications(userId: string, event: NotificationEvent) {
  listeners.get(userId)?.forEach(listener => listener(event));
}
