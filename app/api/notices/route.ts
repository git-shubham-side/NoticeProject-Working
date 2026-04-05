import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import { createNoticeNotifications } from '@/lib/notifications';
import { getDeliveryChannelStatus } from '@/lib/notification-delivery';
import type { Notice } from '@/types';
import { classifyNoticeContent } from '@/lib/notice-classifier';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const priority = searchParams.get('priority');
    const targetType = searchParams.get('targetType');
    const publishedOnly = searchParams.get('publishedOnly') === 'true';
    const bookmarkedOnly = searchParams.get('bookmarked') === 'true';
    const unreadOnly = searchParams.get('unread') === 'true';

    let notices = [...dataStore.notices];

    // Filter based on user role
    if (user.role === 'student') {
      // Students see only notices targeted to them
      notices = notices.filter(notice => {
        if (!notice.isPublished) return false;
        
        // Check if notice has expired
        if (notice.expiresAt && new Date(notice.expiresAt) < new Date()) {
          return false;
        }
        
        // Check targeting
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
    } else if (user.role === 'teacher') {
      // Teachers see their own notices + notices targeted to them
      notices = notices.filter(notice => {
        if (notice.authorId === user.id) return true;
        if (!notice.isPublished) return false;
        
        switch (notice.targetType) {
          case 'all':
            return true;
          case 'institution':
            return notice.targetIds.includes(user.institutionId || '');
          case 'department':
            return notice.targetIds.includes(user.departmentId || '');
          default:
            return false;
        }
      });
    } else if (user.role === 'institution_admin') {
      // Institution admins see all notices in their institution
      notices = notices.filter(notice => 
        notice.institutionId === user.institutionId || 
        notice.targetType === 'all' ||
        (notice.targetType === 'institution' && notice.targetIds.includes(user.institutionId || ''))
      );
    }
    // Super admin sees all

    // Apply filters
    if (authorId) {
      notices = notices.filter(n => n.authorId === authorId);
    }
    if (priority) {
      notices = notices.filter(n => n.priority === priority);
    }
    if (targetType) {
      notices = notices.filter(n => n.targetType === targetType);
    }
    if (publishedOnly) {
      notices = notices.filter(n => n.isPublished);
    }

    const readNoticeIds = new Set(
      dataStore.noticeReadStatus
        .filter(readStatus => readStatus.userId === user.id)
        .map(readStatus => readStatus.noticeId)
    );
    const bookmarkedNoticeIds = new Set(
      dataStore.bookmarks
        .filter(bookmark => bookmark.userId === user.id)
        .map(bookmark => bookmark.noticeId)
    );

    if (bookmarkedOnly) {
      notices = notices.filter(notice => bookmarkedNoticeIds.has(notice.id));
    }

    if (unreadOnly) {
      notices = notices.filter(notice => !readNoticeIds.has(notice.id));
    }

    // Sort by date
    notices.sort((a, b) => 
      new Date(b.publishedAt || b.createdAt).getTime() - 
      new Date(a.publishedAt || a.createdAt).getTime()
    );

    // Include author info
    const noticesWithAuthor = notices.map(notice => ({
      ...notice,
      author: dataStore.users.find(u => u.id === notice.authorId),
      isRead: readNoticeIds.has(notice.id),
      isBookmarked: bookmarkedNoticeIds.has(notice.id),
      readStats: canViewReadStats(notice, user) ? getStudentReadStats(notice) : undefined,
    }));

    return NextResponse.json({ notices: noticesWithAuthor });
  } catch (error) {
    console.error('Notices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getTargetedUserIds(notice: Pick<Notice, 'targetType' | 'targetIds'>) {
  switch (notice.targetType) {
    case 'all':
      return dataStore.users.map(user => user.id);
    case 'institution':
      return dataStore.users
        .filter(user => notice.targetIds.includes(user.institutionId || ''))
        .map(user => user.id);
    case 'department':
      return dataStore.users
        .filter(user => notice.targetIds.includes(user.departmentId || ''))
        .map(user => user.id);
    case 'class':
      return dataStore.users
        .filter(user => notice.targetIds.includes(user.classId || ''))
        .map(user => user.id);
    case 'specific_users':
      return notice.targetIds;
    default:
      return [];
  }
}

function getStudentReadStats(notice: Pick<Notice, 'id' | 'targetType' | 'targetIds'>) {
  const targetedStudents = dataStore.users.filter(
    user => user.role === 'student' && getTargetedUserIds(notice).includes(user.id)
  );

  const readStudentIds = new Set(
    dataStore.noticeReadStatus
      .filter(record => record.noticeId === notice.id)
      .map(record => record.userId)
  );

  return {
    totalStudents: targetedStudents.length,
    readCount: targetedStudents.filter(student => readStudentIds.has(student.id)).length,
    unreadCount: targetedStudents.filter(student => !readStudentIds.has(student.id)).length,
  };
}

function canViewReadStats(
  notice: Pick<Notice, 'authorId' | 'institutionId'>,
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
) {
  if (user.role === 'super_admin') {
    return true;
  }

  if (user.role === 'institution_admin') {
    return notice.institutionId === user.institutionId;
  }

  return user.role === 'teacher' && notice.authorId === user.id;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role === 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      content,
      priority = 'medium',
      targetType = 'all',
      targetIds = [],
      attachments = [],
      category = 'other',
      summary,
      translations = [],
      requiresAcknowledgement = false,
      acknowledgementDeadline,
      isPublished = false,
      publishedAt,
      expiresAt,
      scheduledAt,
      deliveryChannels,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Validate targeting based on role
    if (user.role === 'teacher') {
      if (!['department', 'class', 'specific_users'].includes(targetType)) {
        return NextResponse.json(
          { error: 'Teachers can only target department, class, or specific users' },
          { status: 403 }
        );
      }
    }

    const classifiedCategory =
      category === 'other'
        ? classifyNoticeContent({ title, content }).category
        : category;

    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      title,
      content,
      category: classifiedCategory,
      priority,
      targetType,
      targetIds,
      authorId: user.id,
      institutionId: user.institutionId,
      attachments,
      summary,
      translations,
      requiresAcknowledgement,
      acknowledgementDeadline: acknowledgementDeadline ? new Date(acknowledgementDeadline) : undefined,
      isPublished,
      publishedAt: isPublished ? new Date() : publishedAt ? new Date(publishedAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      deliveryChannels,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.notices.push(newNotice);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'CREATE',
      entityType: 'notice',
      entityId: newNotice.id,
      details: `Created notice: ${title}`,
      createdAt: new Date(),
    });

    // Create notifications for targeted users if published
    if (isPublished) {
      await createNoticeNotifications(newNotice, user.id);
    }

    return NextResponse.json({
      notice: newNotice,
      deliveryStatus: getDeliveryChannelStatus(),
    }, { status: 201 });
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
