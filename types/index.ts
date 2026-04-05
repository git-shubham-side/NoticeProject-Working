// User Roles
export type UserRole = 'super_admin' | 'institution_admin' | 'teacher' | 'student';
export type LanguageCode = 'en' | 'hi' | 'mr';

// User
export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  institutionId?: string;
  departmentId?: string;
  classId?: string;
  avatar?: string;
  phone?: string;
  preferredLanguage?: LanguageCode;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Institution
export interface Institution {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Department
export interface Department {
  id: string;
  name: string;
  code: string;
  institutionId: string;
  headId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Class
export interface Class {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  institutionId: string;
  year: number;
  section?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notice Priority
export type NoticePriority = 'low' | 'medium' | 'high' | 'urgent';
export type NoticeCategory =
  | 'academic'
  | 'administrative'
  | 'events'
  | 'examinations'
  | 'sports'
  | 'cultural'
  | 'placement'
  | 'other';

// Notice Target Type
export type NoticeTargetType = 'all' | 'institution' | 'department' | 'class' | 'specific_users';

// Notice
export interface Notice {
  id: string;
  title: string;
  content: string;
  category?: NoticeCategory;
  priority: NoticePriority;
  targetType: NoticeTargetType;
  targetIds: string[];
  authorId: string;
  institutionId?: string;
  attachments: Attachment[];
  summary?: string;
  translations?: NoticeTranslation[];
  requiresAcknowledgement?: boolean;
  acknowledgementDeadline?: Date;
  isPublished: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  scheduledAt?: Date;
  deliveryChannels?: NoticeDeliveryChannels;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoticeDeliveryChannels {
  inApp: boolean;
  email: boolean;
}

export interface NoticeTranslation {
  language: LanguageCode;
  title: string;
  content: string;
  summary?: string;
  generatedBy?: 'manual' | 'assistant';
}

// Attachment
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Notice Read Status
export interface NoticeReadStatus {
  id: string;
  noticeId: string;
  userId: string;
  readAt: Date;
}

export interface NoticeAcknowledgement {
  id: string;
  noticeId: string;
  userId: string;
  acknowledgedAt: Date;
}

// Bookmark
export interface Bookmark {
  id: string;
  noticeId: string;
  userId: string;
  createdAt: Date;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'notice' | 'system' | 'reminder';
  priority?: NoticePriority;
  referenceId?: string;
  link?: string;
  sender?: Pick<User, 'id' | 'name'>;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  notifyNewNotices: boolean;
  notifyUrgent: boolean;
  notifyReminders: boolean;
  dailyDigest: boolean;
}

// Activity Log
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  type?: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  user?: Pick<User, 'id' | 'name'>;
  createdAt: Date;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalNotices: number;
  totalInstitutions: number;
  totalDepartments: number;
  totalClasses: number;
  activeNotices: number;
  unreadNotices: number;
  recentActivity: ActivityLog[];
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institutionId?: string;
  departmentId?: string;
  classId?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
