import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import type { Class } from '@/types';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const institutionId = searchParams.get('institutionId');

    let classes = dataStore.classes;

    // Filter by department
    if (departmentId) {
      classes = classes.filter(c => c.departmentId === departmentId);
    }

    // Filter by institution
    if (institutionId) {
      classes = classes.filter(c => c.institutionId === institutionId);
    } else if (user.role !== 'super_admin' && user.institutionId) {
      classes = classes.filter(c => c.institutionId === user.institutionId);
    }

    // Include department and institution names
    const classesWithDetails = classes.map(cls => ({
      ...cls,
      department: dataStore.departments.find(d => d.id === cls.departmentId),
      institution: dataStore.institutions.find(i => i.id === cls.institutionId),
    }));

    return NextResponse.json({ classes: classesWithDetails });
  } catch (error) {
    console.error('Classes error:', error);
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
    const { name, code, departmentId, year, section } = body;

    if (!name || !code || !departmentId) {
      return NextResponse.json(
        { error: 'Name, code, and department are required' },
        { status: 400 }
      );
    }

    // Verify department exists
    const department = dataStore.departments.find(d => d.id === departmentId);
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check access for institution admin
    if (user.role === 'institution_admin' && user.institutionId !== department.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check for duplicate code in same department
    if (dataStore.classes.some(c => c.code === code && c.departmentId === departmentId)) {
      return NextResponse.json(
        { error: 'Class code already exists in this department' },
        { status: 400 }
      );
    }

    const newClass: Class = {
      id: `class-${Date.now()}`,
      name,
      code,
      departmentId,
      institutionId: department.institutionId,
      year: year || 1,
      section,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.classes.push(newClass);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'CREATE',
      entityType: 'class',
      entityId: newClass.id,
      details: `Created class: ${name}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
