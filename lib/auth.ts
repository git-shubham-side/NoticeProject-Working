import { cookies } from 'next/headers';
import { dataStore } from './mock-data';
import { getStoreValue, setStoreValue } from './db';
import type { User } from '@/types';

const AUTH_COOKIE_NAME = 'noticeboard_auth';

export async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or similar
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_secret');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

type SessionRecord = Record<string, { userId: string; expiresAt: string }>;

function getSessions(): SessionRecord {
  return getStoreValue<SessionRecord>('sessions') ?? {};
}

function setSessions(sessions: SessionRecord) {
  setStoreValue('sessions', sessions);
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const sessions = getSessions();
  sessions[token] = { userId, expiresAt: expiresAt.toISOString() };
  setSessions(sessions);
  
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return token;
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  const sessions = getSessions();
  const session = sessions[token];
  if (!session) return null;
  
  if (new Date() > new Date(session.expiresAt)) {
    delete sessions[token];
    setSessions(sessions);
    return null;
  }
  
  return { userId: session.userId };
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  
  const user = dataStore.users.find(u => u.id === session.userId);
  if (!user) return null;
  
  // Don't return password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  
  if (token) {
    const sessions = getSessions();
    delete sessions[token];
    setSessions(sessions);
  }
  
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export function hasPermission(user: User, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    super_admin: [
      'manage_institutions',
      'manage_departments',
      'manage_classes',
      'manage_users',
      'manage_all_notices',
      'view_all_analytics',
      'view_activity_logs',
    ],
    institution_admin: [
      'manage_departments',
      'manage_classes',
      'manage_users',
      'manage_institution_notices',
      'view_institution_analytics',
    ],
    teacher: [
      'create_notices',
      'manage_own_notices',
      'view_class_students',
    ],
    student: [
      'view_notices',
      'bookmark_notices',
      'view_notifications',
    ],
  };
  
  return rolePermissions[user.role]?.includes(permission) ?? false;
}
