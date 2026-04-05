import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import { publishToUserNotifications } from '@/lib/realtime';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const notification = dataStore.notifications.find(
    item => item.id === id && item.userId === user.id
  );

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  notification.isRead = true;
  publishToUserNotifications(user.id, {
    type: 'notification.updated',
    notificationId: notification.id,
    notification,
  });

  return NextResponse.json({
    success: true,
    message: 'Notification marked as read',
  });
}
