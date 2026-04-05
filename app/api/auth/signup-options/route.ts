import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/mock-data';

export async function GET() {
  try {
    const institutions = dataStore.institutions
      .filter(institution => institution.isActive)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(({ id, name, code }) => ({ id, name, code }));

    const departments = dataStore.departments
      .filter(department => department.isActive)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(({ id, name, code, institutionId }) => ({ id, name, code, institutionId }));

    const classes = dataStore.classes
      .filter(classItem => classItem.isActive)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(({ id, name, code, institutionId, departmentId, year, section }) => ({
        id,
        name,
        code,
        institutionId,
        departmentId,
        year,
        section,
      }));

    return NextResponse.json({
      institutions,
      departments,
      classes,
    });
  } catch (error) {
    console.error('Signup options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
