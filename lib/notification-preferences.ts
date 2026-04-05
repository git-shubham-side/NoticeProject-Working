import type { NotificationPreferences } from '@/types';
import { getStoreValue, setStoreValue } from './db';

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  notifyNewNotices: true,
  notifyUrgent: true,
  notifyReminders: true,
  dailyDigest: false,
};

type PreferencesStore = Record<string, NotificationPreferences>;

function getPreferencesStore() {
  return getStoreValue<PreferencesStore>('notificationPreferences') ?? {};
}

function setPreferencesStore(store: PreferencesStore) {
  setStoreValue('notificationPreferences', store);
}

export function getNotificationPreferences(userId: string): NotificationPreferences {
  const store = getPreferencesStore();
  return store[userId] ?? defaultPreferences;
}

export function setNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
  const store = getPreferencesStore();
  store[userId] = {
    ...defaultPreferences,
    ...(store[userId] ?? {}),
    ...preferences,
  };
  setPreferencesStore(store);
  return store[userId];
}
