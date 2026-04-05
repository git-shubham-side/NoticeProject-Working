import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const entityType = searchParams.get('type');
  const userId = searchParams.get('userId');

  let logs = [...dataStore.activityLogs];

  if (entityType && entityType !== 'all') {
    logs = logs.filter(log => log.entityType === entityType);
  }

  if (userId) {
    logs = logs.filter(log => log.userId === userId);
  }

  if (user.role !== 'super_admin') {
    logs = logs.filter(log => log.userId === user.id);
  }

  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = logs.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  logs = logs.slice(offset, offset + limit);

  const logsWithDetails = logs.map(log => ({
    ...log,
    type: `${log.entityType}_${log.action.toLowerCase()}`,
    user: dataStore.users.find(userRecord => userRecord.id === log.userId)
      ? {
          id: dataStore.users.find(userRecord => userRecord.id === log.userId)!.id,
          name: dataStore.users.find(userRecord => userRecord.id === log.userId)!.name,
        }
      : undefined,
  }));

  return NextResponse.json({
    logs: logsWithDetails,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    }
  });
}
