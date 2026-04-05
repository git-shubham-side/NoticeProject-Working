import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get notices relevant to this student
    const relevantNotices = dataStore.notices.filter(notice => {
      if (!notice.isPublished) return false;
      
      switch (notice.targetType) {
        case 'all':
          return true;
        case 'institution':
          return notice.targetIds.includes(user.institutionId || '');
        case 'department':
          return notice.targetIds.includes(user.departmentId || '');
        case 'class':
          return notice.targetIds.includes(user.classId || '');
        case 'specific_users':
          return notice.targetIds.includes(user.id);
        default:
          return false;
      }
    });

    const readNoticeIds = dataStore.noticeReadStatus
      .filter(r => r.userId === user.id)
      .map(r => r.noticeId);

    const userBookmarks = dataStore.bookmarks.filter(b => b.userId === user.id);
    const userNotifications = dataStore.notifications.filter(n => n.userId === user.id);

    const stats = {
      totalNotices: relevantNotices.length,
      unreadNotices: relevantNotices.filter(n => !readNoticeIds.includes(n.id)).length,
      bookmarkedNotices: userBookmarks.length,
      unreadNotifications: userNotifications.filter(n => !n.isRead).length,
    };

    const recentNotices = relevantNotices
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .slice(0, 5);

    const recentNotifications = userNotifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      stats,
      recentNotices,
      recentNotifications,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
