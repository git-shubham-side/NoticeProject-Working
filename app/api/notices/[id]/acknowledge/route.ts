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
  const notice = dataStore.notices.find(item => item.id === id);

  if (!notice) {
    return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
  }

  if (!notice.requiresAcknowledgement) {
    return NextResponse.json({ error: 'Acknowledgement is not required for this notice' }, { status: 400 });
  }

  const existing = dataStore.noticeAcknowledgements.find(
    acknowledgement => acknowledgement.noticeId === id && acknowledgement.userId === user.id
  );

  if (!existing) {
    dataStore.noticeAcknowledgements.push({
      id: `ack-${Date.now()}-${user.id}`,
      noticeId: id,
      userId: user.id,
      acknowledgedAt: new Date(),
    });

    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'ACKNOWLEDGE',
      entityType: 'notice',
      entityId: id,
      details: `Acknowledged notice: ${notice.title}`,
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ success: true });
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
  const acknowledgement = dataStore.noticeAcknowledgements.find(
    item => item.noticeId === id && item.userId === user.id
  );

  return NextResponse.json({
    acknowledged: Boolean(acknowledgement),
    acknowledgedAt: acknowledgement?.acknowledgedAt ?? null,
  });
}
