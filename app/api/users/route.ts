import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import type { User } from '@/types';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const institutionId = searchParams.get('institutionId');
    const departmentId = searchParams.get('departmentId');
    const classId = searchParams.get('classId');

    let users = dataStore.users.map(u => {
      const { password: _, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });

    // Filter by role
    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Filter by institution
    if (institutionId) {
      users = users.filter(u => u.institutionId === institutionId);
    } else if (user.role !== 'super_admin' && user.institutionId) {
      users = users.filter(u => u.institutionId === user.institutionId);
    }

    // Filter by department
    if (departmentId) {
      users = users.filter(u => u.departmentId === departmentId);
    } else if (user.role === 'teacher' && user.departmentId) {
      users = users.filter(u => u.departmentId === user.departmentId && u.role === 'student');
    }

    // Filter by class
    if (classId) {
      users = users.filter(u => u.classId === classId);
    }

    // Include related data
    const usersWithDetails = users.map(u => ({
      ...u,
      institution: u.institutionId ? dataStore.institutions.find(i => i.id === u.institutionId) : undefined,
      department: u.departmentId ? dataStore.departments.find(d => d.id === u.departmentId) : undefined,
      class: u.classId ? dataStore.classes.find(c => c.id === u.classId) : undefined,
    }));

    return NextResponse.json({ users: usersWithDetails });
  } catch (error) {
    console.error('Users error:', error);
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
    const { name, email, password, role, institutionId, departmentId, classId, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    if (dataStore.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Validate role permissions
    if (user.role === 'institution_admin') {
      if (role === 'super_admin') {
        return NextResponse.json({ error: 'Cannot create super admin' }, { status: 403 });
      }
      if (institutionId && institutionId !== user.institutionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role,
      institutionId: institutionId || user.institutionId,
      departmentId,
      classId,
      phone,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.users.push(newUser);

    // Log activity
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: user.id,
      action: 'CREATE',
      entityType: 'user',
      entityId: newUser.id,
      details: `Created user: ${name} (${role})`,
      createdAt: new Date(),
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
