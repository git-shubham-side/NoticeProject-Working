import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Notification } from '@/types';
import { getFirebaseClientDb } from './client';

type FirebaseNotificationRecord = Omit<Notification, 'createdAt'> & {
  createdAt: string;
};

function getNotificationsCollectionPath() {
  return 'notifications';
}

function deserializeNotification(notification: FirebaseNotificationRecord): Notification {
  return {
    ...notification,
    createdAt: new Date(notification.createdAt),
  };
}

export function subscribeToFirebaseNotifications(
  userId: string,
  onChange: (notifications: Notification[]) => void
) {
  const db = getFirebaseClientDb();
  if (!db) {
    return () => {};
  }

  const notificationsQuery = query(
    collection(db, getNotificationsCollectionPath()),
    where('userId', '==', userId)
  );

  return onSnapshot(notificationsQuery, snapshot => {
    const notifications = snapshot.docs
      .map(doc => deserializeNotification(doc.data() as FirebaseNotificationRecord))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

    onChange(notifications);
  });
}
