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
    const classItem = dataStore.classes.find(c => c.id === id);

    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check access
    if (user.role !== 'super_admin' && user.institutionId !== classItem.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const classWithDetails = {
      ...classItem,
      department: dataStore.departments.find(d => d.id === classItem.departmentId),
      institution: dataStore.institutions.find(i => i.id === classItem.institutionId),
    };

    return NextResponse.json({ class: classWithDetails });
  } catch (error) {
    console.error('Get class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !['super_admin', 'institution_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const index = dataStore.classes.findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const classItem = dataStore.classes[index];

    // Check access for institution admin
    if (user.role === 'institution_admin' && user.institutionId !== classItem.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updated = {
      ...classItem,
      ...body,
      id, // Prevent id change
      institutionId: classItem.institutionId, // Prevent institution change
      departmentId: classItem.departmentId, // Prevent department change
      updatedAt: new Date(),
    };

    dataStore.classes[index] = updated;

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'UPDATE',
      entityType: 'class',
      entityId: id,
      details: `Updated class: ${updated.name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ class: updated });
  } catch (error) {
    console.error('Update class error:', error);
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
    const index = dataStore.classes.findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const classItem = dataStore.classes[index];

    // Check access for institution admin
    if (user.role === 'institution_admin' && user.institutionId !== classItem.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    dataStore.classes.splice(index, 1);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'DELETE',
      entityType: 'class',
      entityId: id,
      details: `Deleted class: ${classItem.name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
