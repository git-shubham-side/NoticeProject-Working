import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import type { Department } from '@/types';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');

    let departments = dataStore.departments;

    // Filter by institution
    if (institutionId) {
      departments = departments.filter(d => d.institutionId === institutionId);
    } else if (user.role !== 'super_admin' && user.institutionId) {
      departments = departments.filter(d => d.institutionId === user.institutionId);
    }

    // Include institution name
    const departmentsWithInstitution = departments.map(dept => ({
      ...dept,
      institution: dataStore.institutions.find(i => i.id === dept.institutionId),
    }));

    return NextResponse.json({ departments: departmentsWithInstitution });
  } catch (error) {
    console.error('Departments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !['super_admin', 'institution_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, institutionId } = body;

    if (!name || !code || !institutionId) {
      return NextResponse.json(
        { error: 'Name, code, and institution are required' },
        { status: 400 }
      );
    }

    // Verify institution exists
    const institution = dataStore.institutions.find(i => i.id === institutionId);
    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    // Check access for institution admin
    if (user.role === 'institution_admin' && user.institutionId !== institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check for duplicate code in same institution
    if (dataStore.departments.some(d => d.code === code && d.institutionId === institutionId)) {
      return NextResponse.json(
        { error: 'Department code already exists in this institution' },
        { status: 400 }
      );
    }

    const newDepartment: Department = {
      id: `dept-${Date.now()}`,
      name,
      code,
      institutionId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.departments.push(newDepartment);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'CREATE',
      entityType: 'department',
      entityId: newDepartment.id,
      details: `Created department: ${name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ department: newDepartment }, { status: 201 });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
