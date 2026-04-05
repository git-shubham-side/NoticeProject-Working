import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import { publishToUserNotifications } from '@/lib/realtime';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  dataStore.notifications
    .filter(notification => notification.userId === user.id)
    .forEach(notification => {
      notification.isRead = true;
    });

  publishToUserNotifications(user.id, {
    type: 'notifications.all_read',
  });

  return NextResponse.json({
    success: true,
    message: 'All notifications marked as read',
  });
}
