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

  const existing = dataStore.bookmarks.find(
    bookmark => bookmark.noticeId === id && bookmark.userId === user.id
  );

  if (!existing) {
    dataStore.bookmarks.push({
      id: `bookmark-${Date.now()}-${user.id}`,
      noticeId: id,
      userId: user.id,
      createdAt: new Date(),
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Notice bookmarked successfully',
  });
}

export async function DELETE(
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

  dataStore.bookmarks = dataStore.bookmarks.filter(
    bookmark => !(bookmark.noticeId === id && bookmark.userId === user.id)
  );

  return NextResponse.json({
    success: true,
    message: 'Bookmark removed successfully',
  });
}
