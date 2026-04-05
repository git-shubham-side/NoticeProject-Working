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
    const institution = dataStore.institutions.find(i => i.id === id);

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    // Check access
    if (user.role !== 'super_admin' && user.institutionId !== institution.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ institution });
  } catch (error) {
    console.error('Get institution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const index = dataStore.institutions.findIndex(i => i.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    const updated = {
      ...dataStore.institutions[index],
      ...body,
      id, // Prevent id change
      updatedAt: new Date(),
    };

    dataStore.institutions[index] = updated;

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'UPDATE',
      entityType: 'institution',
      entityId: id,
      details: `Updated institution: ${updated.name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ institution: updated });
  } catch (error) {
    console.error('Update institution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const index = dataStore.institutions.findIndex(i => i.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    const institution = dataStore.institutions[index];
    dataStore.institutions.splice(index, 1);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'DELETE',
      entityType: 'institution',
      entityId: id,
      details: `Deleted institution: ${institution.name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete institution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
