import type { LanguageCode, UserRole } from '@/types';

export const APP_NAME = 'NoticeBoard';

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'institution_admin', label: 'Institution Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

export const NOTICE_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-500' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500' },
  { value: 'high', label: 'High', color: 'bg-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
] as const;

export const NOTICE_TARGET_TYPES = [
  { value: 'all', label: 'All Users' },
  { value: 'institution', label: 'Specific Institution' },
  { value: 'department', label: 'Specific Department' },
  { value: 'class', label: 'Specific Class' },
  { value: 'specific_users', label: 'Specific Users' },
] as const;

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  super_admin: '/super-admin',
  institution_admin: '/institution-admin',
  teacher: '/teacher',
  student: '/student',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
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

export const NOTICE_CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'events', label: 'Events' },
  { value: 'examinations', label: 'Examinations' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'placement', label: 'Placement' },
  { value: 'other', label: 'Other' },
] as const;

export const LANGUAGE_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
];

export const NOTICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'expired', label: 'Expired' },
] as const;

export const NAV_ITEMS = {
  super_admin: [
    { title: 'Dashboard', href: '/super-admin', icon: 'LayoutDashboard' },
    { title: 'Institutions', href: '/institutions', icon: 'Building2' },
    { title: 'Departments', href: '/departments', icon: 'FolderTree' },
    { title: 'Classes', href: '/classes', icon: 'GraduationCap' },
    { title: 'Users', href: '/users', icon: 'Users' },
    { title: 'Notices', href: '/notices', icon: 'FileText' },
    { title: 'Analytics', href: '/analytics', icon: 'BarChart3' },
    { title: 'Activity Logs', href: '/activity-logs', icon: 'Activity' },
    { title: 'Notifications', href: '/notifications', icon: 'Bell' },
  ],
  institution_admin: [
    { title: 'Dashboard', href: '/institution-admin', icon: 'LayoutDashboard' },
    { title: 'Departments', href: '/departments', icon: 'FolderTree' },
    { title: 'Classes', href: '/classes', icon: 'GraduationCap' },
    { title: 'Users', href: '/users', icon: 'Users' },
    { title: 'Notices', href: '/notices', icon: 'FileText' },
    { title: 'Analytics', href: '/analytics', icon: 'BarChart3' },
    { title: 'Notifications', href: '/notifications', icon: 'Bell' },
  ],
  teacher: [
    { title: 'Dashboard', href: '/teacher', icon: 'LayoutDashboard' },
    { title: 'My Notices', href: '/notices', icon: 'FileText' },
    { title: 'Create Notice', href: '/notices/create', icon: 'PlusCircle' },
    { title: 'Students', href: '/users', icon: 'Users' },
    { title: 'Notifications', href: '/notifications', icon: 'Bell' },
  ],
  student: [
    { title: 'Dashboard', href: '/student', icon: 'LayoutDashboard' },
    { title: 'Notices', href: '/notices', icon: 'FileText' },
    { title: 'Bookmarks', href: '/notices/bookmarks', icon: 'Bookmark' },
    { title: 'Notifications', href: '/notifications', icon: 'Bell' },
  ],
};
