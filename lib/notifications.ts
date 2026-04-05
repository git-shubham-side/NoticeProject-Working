import type { Notice, Notification } from '@/types';
import { deliverNoticeChannels } from './notification-delivery';
import { dataStore } from './mock-data';
import { publishToUserNotifications } from './realtime';
import { getLocalizedNoticeContent } from './notice-assistant';

export function getTargetedUserIds(notice: Pick<Notice, 'targetType' | 'targetIds'>): string[] {
  const userIds: string[] = [];

  switch (notice.targetType) {
    case 'all':
      dataStore.users.forEach(user => userIds.push(user.id));
      break;
    case 'institution':
      dataStore.users
        .filter(user => notice.targetIds.includes(user.institutionId || ''))
        .forEach(user => userIds.push(user.id));
      break;
    case 'department':
      dataStore.users
        .filter(user => notice.targetIds.includes(user.departmentId || ''))
        .forEach(user => userIds.push(user.id));
      break;
    case 'class':
      dataStore.users
        .filter(user => notice.targetIds.includes(user.classId || ''))
        .forEach(user => userIds.push(user.id));
      break;
    case 'specific_users':
      notice.targetIds.forEach(id => userIds.push(id));
      break;
  }

  return [...new Set(userIds)];
}

export async function createNoticeNotifications(notice: Notice, excludeUserId: string) {
  const recipients = getTargetedUserIds(notice);
  const recipientUsers = dataStore.users.filter(user => recipients.includes(user.id) && user.id !== excludeUserId);

  await deliverNoticeChannels(notice, recipientUsers, notice.deliveryChannels);

  if (notice.deliveryChannels && !notice.deliveryChannels.inApp) {
    return;
  }

  await Promise.all(recipients.map(async userId => {
    if (userId === excludeUserId) {
      return;
    }

    const recipient = dataStore.users.find(user => user.id === userId);
    const localized = getLocalizedNoticeContent(notice, recipient?.preferredLanguage ?? 'en');

    const notification: Notification = {
      id: `notif-${Date.now()}-${userId}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      title: 'New Notice',
      message: `${notice.priority === 'urgent' ? '[URGENT] ' : ''}${localized.title}`,
      type: 'notice',
      priority: notice.priority,
      referenceId: notice.id,
      link: `/notices/${notice.id}`,
      isRead: false,
      createdAt: new Date(),
    };

    dataStore.notifications.push(notification);
    publishToUserNotifications(userId, {
      type: 'notification.created',
      notification,
    });
  }));
}
