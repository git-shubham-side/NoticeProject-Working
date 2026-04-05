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
    const department = dataStore.departments.find(d => d.id === id);

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check access
    if (user.role !== 'super_admin' && user.institutionId !== department.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const departmentWithInstitution = {
      ...department,
      institution: dataStore.institutions.find(i => i.id === department.institutionId),
    };

    return NextResponse.json({ department: departmentWithInstitution });
  } catch (error) {
    console.error('Get department error:', error);
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
    const index = dataStore.departments.findIndex(d => d.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const department = dataStore.departments[index];

    // Check access for institution admin
    if (user.role === 'institution_admin' && user.institutionId !== department.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updated = {
      ...department,
      ...body,
      id, // Prevent id change
      institutionId: department.institutionId, // Prevent institution change
      updatedAt: new Date(),
    };

    dataStore.departments[index] = updated;

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'UPDATE',
      entityType: 'department',
      entityId: id,
      details: `Updated department: ${updated.name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ department: updated });
  } catch (error) {
    console.error('Update department error:', error);
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
    const index = dataStore.departments.findIndex(d => d.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const department = dataStore.departments[index];

    // Check access for institution admin
    if (user.role === 'institution_admin' && user.institutionId !== department.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    dataStore.departments.splice(index, 1);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'DELETE',
      entityType: 'department',
      entityId: id,
      details: `Deleted department: ${department.name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
