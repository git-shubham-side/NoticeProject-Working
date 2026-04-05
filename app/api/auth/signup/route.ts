import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { dataStore } from '@/lib/mock-data';
import type { LanguageCode, User, UserRole } from '@/types';

const ALLOWED_SIGNUP_ROLES: UserRole[] = ['teacher', 'student'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      institutionId,
      departmentId,
      classId,
      phone,
      preferredLanguage,
    } = body;

    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPassword = typeof password === 'string' ? password.trim() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : undefined;
    const normalizedPreferredLanguage =
      preferredLanguage === 'hi' || preferredLanguage === 'mr' || preferredLanguage === 'en'
        ? (preferredLanguage as LanguageCode)
        : 'en';

    if (!normalizedName || !normalizedEmail || !normalizedPassword || !role || !institutionId || !departmentId) {
      return NextResponse.json(
        { error: 'Name, email, password, role, institution, and department are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_SIGNUP_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Only teacher and student registration is allowed' },
        { status: 403 }
      );
    }

    if (role === 'student' && !classId) {
      return NextResponse.json(
        { error: 'Class is required for student registration' },
        { status: 400 }
      );
    }

    if (dataStore.users.some(user => user.email.toLowerCase() === normalizedEmail)) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const institution = dataStore.institutions.find(item => item.id === institutionId && item.isActive);
    const department = dataStore.departments.find(
      item => item.id === departmentId && item.institutionId === institutionId && item.isActive
    );
    const classItem =
      role === 'student'
        ? dataStore.classes.find(
            item =>
              item.id === classId &&
              item.departmentId === departmentId &&
              item.institutionId === institutionId &&
              item.isActive
          )
        : undefined;

    if (!institution || !department || (role === 'student' && !classItem)) {
      return NextResponse.json(
        { error: 'Invalid institution, department, or class selection' },
        { status: 400 }
      );
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      role,
      institutionId,
      departmentId,
      classId: role === 'student' ? classId : undefined,
      phone: normalizedPhone,
      preferredLanguage: normalizedPreferredLanguage,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.users.push(newUser);
    dataStore.activityLogs.push({
      id: `log-${Date.now()}`,
      userId: newUser.id,
      action: 'CREATE',
      entityType: 'user',
      entityId: newUser.id,
      details: `Self-registered user: ${normalizedName} (${role})`,
      createdAt: new Date(),
    });

    await createSession(newUser.id);

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
