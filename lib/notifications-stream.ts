'use client';

type NotificationStreamEvent = {
  type: 'notification.created' | 'notification.updated' | 'notifications.all_read';
  notification?: unknown;
  notificationId?: string;
};

export function subscribeToNotificationStream(
  onEvent: (event: NotificationStreamEvent) => void
) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const source = new EventSource('/api/notifications/stream');
  const eventNames: NotificationStreamEvent['type'][] = [
    'notification.created',
    'notification.updated',
    'notifications.all_read',
  ];

  eventNames.forEach((eventName) => {
    source.addEventListener(eventName, (event) => {
      try {
        onEvent(JSON.parse((event as MessageEvent).data) as NotificationStreamEvent);
      } catch {
        onEvent({ type: eventName });
      }
    });
  });

  source.onerror = () => {
    source.close();
  };

  return () => {
    source.close();
  };
}
