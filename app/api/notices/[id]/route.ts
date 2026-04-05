import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import { createNoticeNotifications } from '@/lib/notifications';
import { getDeliveryChannelStatus } from '@/lib/notification-delivery';
import type { Notice } from '@/types';
import { getLocalizedNoticeContent } from '@/lib/notice-assistant';
import { classifyNoticeContent } from '@/lib/notice-classifier';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const requestedLanguage = searchParams.get('lang');
    const notice = dataStore.notices.find(n => n.id === id);

    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    // Check access based on role and targeting
    const hasAccess = checkNoticeAccess(notice, user);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const preferredLanguage =
      requestedLanguage === 'hi' || requestedLanguage === 'mr' || requestedLanguage === 'en'
        ? requestedLanguage
        : user.preferredLanguage ?? 'en';
    const localized = getLocalizedNoticeContent(notice, preferredLanguage);

    const noticeWithDetails = {
      ...notice,
      author: dataStore.users.find(u => u.id === notice.authorId),
      isRead: dataStore.noticeReadStatus.some(
        r => r.noticeId === notice.id && r.userId === user.id
      ),
      isAcknowledged: dataStore.noticeAcknowledgements.some(
        acknowledgement => acknowledgement.noticeId === notice.id && acknowledgement.userId === user.id
      ),
      isBookmarked: dataStore.bookmarks.some(
        b => b.noticeId === notice.id && b.userId === user.id
      ),
      audienceLabels: getAudienceLabels(notice.targetType, notice.targetIds),
      readStats: getStudentReadStats(notice),
      acknowledgementStats: getStudentAcknowledgementStats(notice),
      localized,
    };

    return NextResponse.json({ notice: noticeWithDetails });
  } catch (error) {
    console.error('Get notice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role === 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const index = dataStore.notices.findIndex(n => n.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    const notice = dataStore.notices[index];

    // Check if user can edit this notice
    const canEdit = 
      user.role === 'super_admin' ||
      (user.role === 'institution_admin' && notice.institutionId === user.institutionId) ||
      notice.authorId === user.id;

    if (!canEdit) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const wasPublished = notice.isPublished;
    const isNowPublished = body.isPublished;

    const updated = {
      ...notice,
      ...body,
      id,
      authorId: notice.authorId,
      category:
        (body.category as Notice['category'] | undefined) === 'other'
          ? classifyNoticeContent({
              title: body.title ?? notice.title,
              content: body.content ?? notice.content,
            }).category
          : (body.category ?? notice.category),
      acknowledgementDeadline: body.acknowledgementDeadline
        ? new Date(body.acknowledgementDeadline)
        : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      publishedAt: !wasPublished && isNowPublished ? new Date() : notice.publishedAt,
      updatedAt: new Date(),
    };

    dataStore.notices[index] = updated;

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'UPDATE',
      entityType: 'notice',
      entityId: id,
      details: `Updated notice: ${updated.title}`,
      createdAt: new Date(),
    });

    // Create notifications if just published
    if (!wasPublished && isNowPublished) {
      await createNoticeNotifications(updated, user.id);
    }

    return NextResponse.json({
      notice: updated,
      deliveryStatus: getDeliveryChannelStatus(),
    });
  } catch (error) {
    console.error('Update notice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role === 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const index = dataStore.notices.findIndex(n => n.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    const notice = dataStore.notices[index];

    // Check if user can delete this notice
    const canDelete = 
      user.role === 'super_admin' ||
      (user.role === 'institution_admin' && notice.institutionId === user.institutionId) ||
      notice.authorId === user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    dataStore.notices.splice(index, 1);

    // Clean up related data
    dataStore.noticeReadStatus = dataStore.noticeReadStatus.filter(r => r.noticeId !== id);
    dataStore.noticeAcknowledgements = dataStore.noticeAcknowledgements.filter(
      acknowledgement => acknowledgement.noticeId !== id
    );
    dataStore.bookmarks = dataStore.bookmarks.filter(b => b.noticeId !== id);
    dataStore.notifications = dataStore.notifications.filter(n => n.referenceId !== id);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'DELETE',
      entityType: 'notice',
      entityId: id,
      details: `Deleted notice: ${notice.title}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getAudienceLabels(targetType: string, targetIds: string[]) {
  switch (targetType) {
    case 'institution':
      return {
        institutions: dataStore.institutions
          .filter(institution => targetIds.includes(institution.id))
          .map(institution => institution.name),
      };
    case 'department':
      return {
        departments: dataStore.departments
          .filter(department => targetIds.includes(department.id))
          .map(department => department.name),
      };
    case 'class':
      return {
        classes: dataStore.classes
          .filter(classItem => targetIds.includes(classItem.id))
          .map(classItem => classItem.name),
      };
    case 'specific_users':
      return {
        users: dataStore.users
          .filter(user => targetIds.includes(user.id))
          .map(user => user.name),
      };
    case 'all':
      return {
        roles: ['All users'],
      };
    default:
      return {};
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

  const readStudents = targetedStudents.filter(student => readStudentIds.has(student.id));
  const unreadStudents = targetedStudents.filter(student => !readStudentIds.has(student.id));

  return {
    totalStudents: targetedStudents.length,
    readCount: readStudents.length,
    unreadCount: unreadStudents.length,
  };
}

function getStudentAcknowledgementStats(notice: Pick<Notice, 'id' | 'targetType' | 'targetIds'>) {
  const targetedStudents = dataStore.users.filter(
    user => user.role === 'student' && getTargetedUserIds(notice).includes(user.id)
  );

  const acknowledgedStudentIds = new Set(
    dataStore.noticeAcknowledgements
      .filter(record => record.noticeId === notice.id)
      .map(record => record.userId)
  );

  return {
    acknowledgedCount: targetedStudents.filter(student => acknowledgedStudentIds.has(student.id)).length,
    pendingCount: targetedStudents.filter(student => !acknowledgedStudentIds.has(student.id)).length,
  };
}

function checkNoticeAccess(notice: { targetType: string; targetIds: string[]; isPublished: boolean; authorId: string; institutionId?: string }, user: { id: string; role: string; institutionId?: string; departmentId?: string; classId?: string }): boolean {
  // Author always has access
  if (notice.authorId === user.id) return true;
  
  // Super admin has access to all
  if (user.role === 'super_admin') return true;
  
  // Institution admin has access to their institution's notices
  if (user.role === 'institution_admin' && notice.institutionId === user.institutionId) return true;
  
  // For others, check if notice is published and targeted to them
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
}
