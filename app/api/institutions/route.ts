import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import type { Institution } from '@/types';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let institutions = dataStore.institutions;

    // Filter by user's institution if not super admin
    if (user.role !== 'super_admin' && user.institutionId) {
      institutions = institutions.filter(i => i.id === user.institutionId);
    }

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error('Institutions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, address, phone, email } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check for duplicate code
    if (dataStore.institutions.some(i => i.code === code)) {
      return NextResponse.json(
        { error: 'Institution code already exists' },
        { status: 400 }
      );
    }

    const newInstitution: Institution = {
      id: `inst-${Date.now()}`,
      name,
      code,
      address,
      phone,
      email,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.institutions.push(newInstitution);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'CREATE',
      entityType: 'institution',
      entityId: newInstitution.id,
      details: `Created institution: ${name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ institution: newInstitution }, { status: 201 });
  } catch (error) {
    console.error('Create institution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
