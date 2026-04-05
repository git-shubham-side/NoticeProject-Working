import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const stats = {
      totalInstitutions: dataStore.institutions.length,
      totalDepartments: dataStore.departments.length,
      totalClasses: dataStore.classes.length,
      totalUsers: dataStore.users.length,
      totalNotices: dataStore.notices.length,
      activeNotices: dataStore.notices.filter(n => n.isPublished).length,
    };

    const recentNotices = dataStore.notices
      .filter(n => n.isPublished)
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .slice(0, 5);

    const recentActivity = dataStore.activityLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(log => ({
        ...log,
        user: dataStore.users.find(u => u.id === log.userId),
      }));

    return NextResponse.json({
      stats,
      recentNotices,
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
