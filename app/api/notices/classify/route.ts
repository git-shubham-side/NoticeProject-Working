import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { classifyNoticeContent } from '@/lib/notice-classifier';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title : '';
    const content = typeof body.content === 'string' ? body.content : '';

    if (!title.trim() && !content.trim()) {
      return NextResponse.json({ error: 'Add title or content first' }, { status: 400 });
    }

    const classification = classifyNoticeContent({ title, content });
    return NextResponse.json({ classification });
  } catch (error) {
    console.error('Notice classification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
