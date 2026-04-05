import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateNoticeSuggestion } from '@/lib/notice-assistant';
import type { LanguageCode, NoticeCategory, NoticePriority } from '@/types';

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
      return NextResponse.json({ error: 'Add a title or content first' }, { status: 400 });
    }

    const suggestion = generateNoticeSuggestion({
      title,
      content,
      priority: body.priority as NoticePriority | undefined,
      category: body.category as NoticeCategory | undefined,
      languages: Array.isArray(body.languages) ? (body.languages as LanguageCode[]) : [],
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Notice assistant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
