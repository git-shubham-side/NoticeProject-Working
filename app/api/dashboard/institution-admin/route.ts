import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'institution_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const institutionId = user.institutionId;

    const stats = {
      totalDepartments: dataStore.departments.filter(d => d.institutionId === institutionId).length,
      totalClasses: dataStore.classes.filter(c => c.institutionId === institutionId).length,
      totalUsers: dataStore.users.filter(u => u.institutionId === institutionId).length,
      totalNotices: dataStore.notices.filter(n => n.institutionId === institutionId || n.targetType === 'all').length,
      activeNotices: dataStore.notices.filter(n => 
        n.isPublished && (n.institutionId === institutionId || n.targetType === 'all')
      ).length,
    };

    const recentNotices = dataStore.notices
      .filter(n => n.isPublished && (n.institutionId === institutionId || n.targetType === 'all'))
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .slice(0, 5);

    const recentActivity = dataStore.activityLogs
      .filter(log => {
        const logUser = dataStore.users.find(u => u.id === log.userId);
        return logUser?.institutionId === institutionId;
      })
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
