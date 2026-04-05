import 'server-only';

import type { Notification } from '@/types';
import { getFirebaseAdminDb } from './admin';

type FirebaseNotificationRecord = Omit<Notification, 'createdAt'> & {
  createdAt: string;
};

function getNotificationsCollectionPath() {
  return 'notifications';
}

function serializeNotification(notification: Notification): FirebaseNotificationRecord {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function syncFirebaseNotification(notification: Notification) {
  const db = getFirebaseAdminDb();
  if (!db) {
    return;
  }

  try {
    await db
      .collection(getNotificationsCollectionPath())
      .doc(notification.id)
      .set(serializeNotification(notification));
  } catch (error) {
    console.error('Firebase notification sync failed:', error);
  }
}

export async function syncFirebaseNotificationsReadState(userId: string, notificationId: string, isRead: boolean) {
  const db = getFirebaseAdminDb();
  if (!db) {
    return;
  }

  try {
    await db
      .collection(getNotificationsCollectionPath())
      .doc(notificationId)
      .set({ userId, isRead }, { merge: true });
  } catch (error) {
    console.error('Firebase notification read-state sync failed:', error);
  }
}

export async function syncFirebaseMarkAllNotificationsRead(userId: string, notificationIds: string[]) {
  const db = getFirebaseAdminDb();
  if (!db || notificationIds.length === 0) {
    return;
  }

  try {
    const batch = db.batch();
    notificationIds.forEach(notificationId => {
      batch.set(
        db.collection(getNotificationsCollectionPath()).doc(notificationId),
        { userId, isRead: true },
        { merge: true }
      );
    });
    await batch.commit();
  } catch (error) {
    console.error('Firebase bulk notification read-state sync failed:', error);
  }
}
