import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { syncFirebaseMarkAllNotificationsRead } from '@/lib/firebase/notifications-server';
import { dataStore } from '@/lib/mock-data';
import { publishToUserNotifications } from '@/lib/realtime';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updatedIds = dataStore.notifications
    .filter(notification => notification.userId === user.id)
    .map(notification => {
      notification.isRead = true;
      return notification.id;
    });

  publishToUserNotifications(user.id, {
    type: 'notifications.all_read',
  });
  await syncFirebaseMarkAllNotificationsRead(user.id, updatedIds);

  return NextResponse.json({
    success: true,
    message: 'All notifications marked as read',
  });
}
