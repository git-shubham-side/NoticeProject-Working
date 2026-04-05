import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const notice = dataStore.notices.find(n => n.id === id);

  if (!notice) {
    return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
  }

  const existing = dataStore.noticeReadStatus.find(
    record => record.noticeId === id && record.userId === user.id
  );

  if (!existing) {
    dataStore.noticeReadStatus.push({
      id: `read-${Date.now()}-${user.id}`,
      noticeId: id,
      userId: user.id,
      readAt: new Date(),
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Notice marked as read',
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const notice = dataStore.notices.find(n => n.id === id);

  if (!notice) {
    return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
  }

  const readRecord = dataStore.noticeReadStatus.find(
    record => record.noticeId === id && record.userId === user.id
  );

  return NextResponse.json({
    isRead: Boolean(readRecord),
    readAt: readRecord?.readAt ?? null,
  });
}
