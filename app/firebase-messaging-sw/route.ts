import { readEnv } from '@/lib/env';

const script = `
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '${readEnv('NEXT_PUBLIC_FIREBASE_API_KEY') ?? ''}',
  authDomain: '${readEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') ?? ''}',
  projectId: '${readEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ?? ''}',
  storageBucket: '${readEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') ?? ''}',
  messagingSenderId: '${readEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ?? ''}',
  appId: '${readEnv('NEXT_PUBLIC_FIREBASE_APP_ID') ?? ''}'
});

if (firebase.messaging.isSupported()) {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};

    self.registration.showNotification(notification.title || 'Notice Board', {
      body: notification.body || 'You have a new notification',
      icon: '/icon-light-32x32.png',
      badge: '/icon-light-32x32.png',
      data,
    });
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const relativeLink = event.notification.data?.link || '/notifications';
    const absoluteLink = new URL(relativeLink, self.location.origin).href;

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate(absoluteLink);
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteLink);
        }
      })
    );
  });
}
`;

export async function GET() {
  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
