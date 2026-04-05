import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const targetUser = dataStore.users.find(u => u.id === id);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check access
    if (user.role !== 'super_admin' && user.id !== id && user.institutionId !== targetUser.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { password: _, ...userWithoutPassword } = targetUser;

    const userWithDetails = {
      ...userWithoutPassword,
      institution: targetUser.institutionId ? dataStore.institutions.find(i => i.id === targetUser.institutionId) : undefined,
      department: targetUser.departmentId ? dataStore.departments.find(d => d.id === targetUser.departmentId) : undefined,
      class: targetUser.classId ? dataStore.classes.find(c => c.id === targetUser.classId) : undefined,
    };

    return NextResponse.json({ user: userWithDetails });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const index = dataStore.users.findIndex(u => u.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = dataStore.users[index];

    // Check access
    const canEdit = 
      user.role === 'super_admin' ||
      user.id === id ||
      (user.role === 'institution_admin' && user.institutionId === targetUser.institutionId);

    if (!canEdit) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prevent role escalation
    if (body.role && user.role !== 'super_admin') {
      if (body.role === 'super_admin' || (targetUser.role === 'super_admin' && body.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Cannot change super admin role' }, { status: 403 });
      }
    }

    const updated = {
      ...targetUser,
      ...body,
      id, // Prevent id change
      password: body.password || targetUser.password,
      updatedAt: new Date(),
    };

    dataStore.users[index] = updated;

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: id,
      details: `Updated user: ${updated.name}`,
      createdAt: new Date(),
    });

    const { password: _, ...userWithoutPassword } = updated;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !['super_admin', 'institution_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const index = dataStore.users.findIndex(u => u.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = dataStore.users[index];

    // Check access for institution admin
    if (user.role === 'institution_admin') {
      if (targetUser.role === 'super_admin' || user.institutionId !== targetUser.institutionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    dataStore.users.splice(index, 1);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'DELETE',
      entityType: 'user',
      entityId: id,
      details: `Deleted user: ${targetUser.name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
