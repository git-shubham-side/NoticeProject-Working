import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import type { Notice } from '@/types';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const myNotices = dataStore.notices.filter(n => n.authorId === user.id);

    const stats = {
      myNotices: myNotices.length,
      publishedNotices: myNotices.filter(n => n.isPublished).length,
      draftNotices: myNotices.filter(n => !n.isPublished).length,
      totalStudents: dataStore.users.filter(u => 
        u.role === 'student' && u.departmentId === user.departmentId
      ).length,
    };

    const noticeAnalytics = myNotices
      .filter(notice => notice.isPublished)
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .slice(0, 6)
      .map(notice => getNoticeReadAnalytics(notice));

    const recentNotices = myNotices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      stats,
      recentNotices,
      noticeAnalytics,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getTargetedStudentIds(notice: Pick<Notice, 'targetType' | 'targetIds'>) {
  return dataStore.users
    .filter(user => {
      if (user.role !== 'student') {
        return false;
      }

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
    })
    .map(student => student.id);
}

function getNoticeReadAnalytics(notice: Notice) {
  const targetedStudentIds = getTargetedStudentIds(notice);
  const readStudentIds = new Set(
    dataStore.noticeReadStatus
      .filter(record => record.noticeId === notice.id && targetedStudentIds.includes(record.userId))
      .map(record => record.userId)
  );

  const totalStudents = targetedStudentIds.length;
  const readCount = readStudentIds.size;
  const unreadCount = Math.max(0, totalStudents - readCount);

  return {
    id: notice.id,
    title: notice.title,
    priority: notice.priority,
    publishedAt: notice.publishedAt || notice.createdAt,
    totalStudents,
    readCount,
    unreadCount,
    readRate: totalStudents > 0 ? Math.round((readCount / totalStudents) * 100) : 0,
  };
}
