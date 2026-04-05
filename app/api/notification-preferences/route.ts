import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNotificationPreferences, setNotificationPreferences } from '@/lib/notification-preferences';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    preferences: getNotificationPreferences(user.id),
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const preferences = setNotificationPreferences(user.id, body ?? {});

  return NextResponse.json({
    success: true,
    preferences,
  });
}
