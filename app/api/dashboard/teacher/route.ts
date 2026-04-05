import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';

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

    const recentNotices = myNotices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      stats,
      recentNotices,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
