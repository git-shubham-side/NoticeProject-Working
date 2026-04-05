'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirebaseClientApp } from './client';
import { readEnv } from '../env';

const TOKEN_STORAGE_KEY = 'noticeboard_push_token';

export async function registerBrowserPushToken() {
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return null;
  }

  const app = getFirebaseClientApp();
  const vapidKey = readEnv('NEXT_PUBLIC_FIREBASE_VAPID_KEY');

  if (!app || !vapidKey || !('Notification' in window)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw', {
    scope: '/',
  });
  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  return token;
}

export function getStoredBrowserPushToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearStoredBrowserPushToken() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
