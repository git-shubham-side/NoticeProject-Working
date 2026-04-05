import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addDeviceToken, removeDeviceToken } from '@/lib/notification-preferences';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  addDeviceToken(user.id, token);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  removeDeviceToken(user.id, token);

  return NextResponse.json({ success: true });
}
