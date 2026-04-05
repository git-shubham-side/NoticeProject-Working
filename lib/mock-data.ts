import type {
  User,
  Institution,
  Department,
  Class,
  Notice,
  Notification,
  NoticeReadStatus,
  NoticeAcknowledgement,
  Bookmark,
  ActivityLog,
} from "@/types";
import { getStoreValue, setStoreValue } from "./db";

// Mock Institutions
export const mockInstitutions: Institution[] = [
  {
    id: "inst-1",
    name: "MGM College",
    code: "MGM",
    address: "Aurangabad Road, MGM Campus",
    phone: "+91-240-100-1001",
    email: "admin@mgmcollege.edu",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "inst-2",
    name: "ITM College",
    code: "ITM",
    address: "ITM Knowledge Park, Main Road",
    phone: "+91-240-100-1002",
    email: "admin@itmcollege.edu",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "inst-3",
    name: "Rajiv Gandhi College",
    code: "RGC",
    address: "Rajiv Gandhi Educational Campus",
    phone: "+91-240-100-1003",
    email: "admin@rajivgandhicollege.edu",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

// Mock Departments
export const mockDepartments: Department[] = [
  {
    id: "dept-1",
    name: "Computer Science",
    code: "CS",
    institutionId: "inst-1",
    isActive: true,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
  {
    id: "dept-2",
    name: "Electrical Engineering",
    code: "EE",
    institutionId: "inst-1",
    isActive: true,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
  {
    id: "dept-3",
    name: "Information Technology",
    code: "IT",
    institutionId: "inst-2",
    isActive: true,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
  {
    id: "dept-4",
    name: "Business Administration",
    code: "BBA",
    institutionId: "inst-3",
    isActive: true,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
];

// Mock Classes
export const mockClasses: Class[] = [
  {
    id: "class-1",
    name: "CS Year 1 Section A",
    code: "CS-1A",
    departmentId: "dept-1",
    institutionId: "inst-1",
    year: 1,
    section: "A",
    isActive: true,
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
  {
    id: "class-2",
    name: "CS Year 2 Section A",
    code: "CS-2A",
    departmentId: "dept-1",
    institutionId: "inst-1",
    year: 2,
    section: "A",
    isActive: true,
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
  {
    id: "class-3",
    name: "IT Year 1 Section A",
    code: "IT-1A",
    departmentId: "dept-3",
    institutionId: "inst-2",
    year: 1,
    section: "A",
    isActive: true,
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
  {
    id: "class-4",
    name: "BBA Year 1 Section A",
    code: "BBA-1A",
    departmentId: "dept-4",
    institutionId: "inst-3",
    year: 1,
    section: "A",
    isActive: true,
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "superadmin@noticeboard.com",
    password: "password123",
    name: "Super Admin",
    role: "super_admin",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "user-2",
    email: "admin@techuniversity.edu",
    password: "password123",
    name: "John Smith",
    role: "institution_admin",
    institutionId: "inst-1",
    isActive: true,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
  {
    id: "user-3",
    email: "teacher@techuniversity.edu",
    password: "password123",
    name: "Dr. Sarah Johnson",
    role: "teacher",
    institutionId: "inst-1",
    departmentId: "dept-1",
    isActive: true,
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
  // {
  //   id: "user-4",
  //   email: "rathodshubham7711@gmail.com",
  //   password: "password123",
  //   name: "Shubham Rathod",
  //   role: "student",
  //   institutionId: "inst-1",
  //   departmentId: "dept-1",
  //   classId: "class-1",
  //   isActive: true,
  //   createdAt: new Date("2024-01-04"),
  //   updatedAt: new Date("2024-01-04"),
  // },
  // {
  //   id: "user-5",
  //   email: "bob@techuniversity.edu",
  //   password: "password123",
  //   name: "Bob Davis",
  //   role: "student",
  //   institutionId: "inst-1",
  //   departmentId: "dept-1",
  //   classId: "class-2",
  //   isActive: true,
  //   createdAt: new Date("2024-01-05"),
  //   updatedAt: new Date("2024-01-05"),
  // },
  {
    id: "user-4",
    email: "rathodshubham0298@gmail.com",
    password: "password123",
    name: "Shubham Rathod",
    role: "student",
    institutionId: "inst-1",
    departmentId: "dept-1",
    classId: "class-1",
    phone: "7559493128",
    preferredLanguage: "en",
    isActive: true,
    createdAt: new Date("2024-01-06"),
    updatedAt: new Date("2024-01-06"),
  },
  {
    id: "user-5",
    email: "bondharemadhav@gmail.com",
    password: "password123",
    name: "Madhav Bondhare",
    role: "student",
    institutionId: "inst-1",
    departmentId: "dept-1",
    classId: "class-1",
    phone: "9359935399",
    preferredLanguage: "mr",
    isActive: true,
    createdAt: new Date("2024-01-06"),
    updatedAt: new Date("2024-01-06"),
  },
];

// Mock Notices
export const mockNotices: Notice[] = [
  {
    id: "notice-1",
    title: "Welcome to New Academic Year 2024",
    content:
      "We are excited to welcome all students and faculty to the new academic year. Please ensure you have completed your registration and collected your ID cards from the administration office.",
    category: "academic",
    priority: "high",
    targetType: "all",
    targetIds: [],
    authorId: "user-1",
    attachments: [],
    summary: "Welcome notice for the new academic year with registration and ID card instructions.",
    translations: [
      {
        language: "hi",
        title: "नए शैक्षणिक वर्ष 2024 में आपका स्वागत है",
        content:
          "हम सभी छात्रों और संकाय सदस्यों का नए शैक्षणिक वर्ष में स्वागत करते हैं। कृपया अपनी पंजीकरण प्रक्रिया पूरी करें और प्रशासन कार्यालय से अपना पहचान पत्र प्राप्त करें।",
        summary: "नए सत्र, पंजीकरण और आईडी कार्ड से जुड़ी सूचना।",
        generatedBy: "manual",
      },
      {
        language: "mr",
        title: "नवीन शैक्षणिक वर्ष 2024 मध्ये स्वागत",
        content:
          "नवीन शैक्षणिक वर्षासाठी सर्व विद्यार्थी आणि शिक्षकांचे स्वागत आहे. कृपया नोंदणी पूर्ण करा आणि प्रशासन कार्यालयातून आपले ओळखपत्र घ्या.",
        summary: "नवीन सत्र, नोंदणी आणि ओळखपत्राविषयी सूचना.",
        generatedBy: "manual",
      },
    ],
    isPublished: true,
    publishedAt: new Date("2024-01-10"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "notice-2",
    title: "Mid-Term Examination Schedule",
    content:
      "The mid-term examinations will be held from February 15th to February 25th. Please check the detailed schedule attached below and prepare accordingly.",
    category: "examinations",
    priority: "urgent",
    targetType: "institution",
    targetIds: ["inst-1"],
    authorId: "user-2",
    institutionId: "inst-1",
    attachments: [
      {
        id: "att-1",
        name: "exam-schedule.pdf",
        url: "/attachments/exam-schedule.pdf",
        type: "application/pdf",
        size: 245000,
      },
    ],
    summary: "Urgent mid-term examination schedule notice for MGM College.",
    requiresAcknowledgement: true,
    isPublished: true,
    publishedAt: new Date("2024-02-01"),
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "notice-3",
    title: "Programming Workshop Next Week",
    content:
      "A workshop on Advanced Python Programming will be conducted next week. All CS students are encouraged to participate. Limited seats available.",
    category: "events",
    priority: "medium",
    targetType: "department",
    targetIds: ["dept-1"],
    authorId: "user-3",
    institutionId: "inst-1",
    attachments: [],
    summary: "Department workshop announcement for Computer Science students.",
    isPublished: true,
    publishedAt: new Date("2024-02-05"),
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },
  {
    id: "notice-4",
    title: "Assignment Submission Deadline Extended",
    content:
      "The deadline for Assignment 3 has been extended by one week. New deadline: February 20th, 2024.",
    category: "academic",
    priority: "low",
    targetType: "class",
    targetIds: ["class-1"],
    authorId: "user-3",
    institutionId: "inst-1",
    attachments: [],
    summary: "Assignment 3 submission deadline has been extended by one week.",
    requiresAcknowledgement: true,
    isPublished: true,
    publishedAt: new Date("2024-02-10"),
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "notice-5",
    title: "Library Hours Extended",
    content:
      "Starting from next month, the library will remain open until 10 PM on weekdays to accommodate students preparing for exams.",
    category: "administrative",
    priority: "medium",
    targetType: "all",
    targetIds: [],
    authorId: "user-1",
    attachments: [],
    summary: "Library weekday timings are extended until 10 PM next month.",
    isPublished: true,
    publishedAt: new Date("2024-02-12"),
    createdAt: new Date("2024-02-12"),
    updatedAt: new Date("2024-02-12"),
  },
];

// Mock Notice Read Status
export const mockNoticeReadStatus: NoticeReadStatus[] = [
  {
    id: "read-1",
    noticeId: "notice-1",
    userId: "user-4",
    readAt: new Date("2024-01-11"),
  },
  {
    id: "read-2",
    noticeId: "notice-2",
    userId: "user-4",
    readAt: new Date("2024-02-02"),
  },
];

export const mockNoticeAcknowledgements: NoticeAcknowledgement[] = [
  {
    id: "ack-1",
    noticeId: "notice-2",
    userId: "user-4",
    acknowledgedAt: new Date("2024-02-03"),
  },
];

// Mock Bookmarks
export const mockBookmarks: Bookmark[] = [
  {
    id: "bookmark-1",
    noticeId: "notice-2",
    userId: "user-4",
    createdAt: new Date("2024-02-02"),
  },
  {
    id: "bookmark-2",
    noticeId: "notice-3",
    userId: "user-4",
    createdAt: new Date("2024-02-06"),
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    userId: "user-4",
    title: "New Notice",
    message:
      "A new urgent notice has been posted: Mid-Term Examination Schedule",
    type: "notice",
    referenceId: "notice-2",
    isRead: true,
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "notif-2",
    userId: "user-4",
    title: "New Notice",
    message: "Programming Workshop Next Week - Check it out!",
    type: "notice",
    referenceId: "notice-3",
    isRead: false,
    createdAt: new Date("2024-02-05"),
  },
  {
    id: "notif-3",
    userId: "user-4",
    title: "Reminder",
    message: "Assignment deadline approaching in 3 days",
    type: "reminder",
    isRead: false,
    createdAt: new Date("2024-02-17"),
  },
];

// Mock Activity Logs
export const mockActivityLogs: ActivityLog[] = [
  {
    id: "log-1",
    userId: "user-1",
    action: "CREATE",
    entityType: "notice",
    entityId: "notice-1",
    details: "Created notice: Welcome to New Academic Year 2024",
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "log-2",
    userId: "user-2",
    action: "CREATE",
    entityType: "notice",
    entityId: "notice-2",
    details: "Created notice: Mid-Term Examination Schedule",
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "log-3",
    userId: "user-3",
    action: "CREATE",
    entityType: "notice",
    entityId: "notice-3",
    details: "Created notice: Programming Workshop Next Week",
    createdAt: new Date("2024-02-05"),
  },
  {
    id: "log-4",
    userId: "user-4",
    action: "READ",
    entityType: "notice",
    entityId: "notice-1",
    details: "Read notice: Welcome to New Academic Year 2024",
    createdAt: new Date("2024-01-11"),
  },
  {
    id: "log-5",
    userId: "user-4",
    action: "BOOKMARK",
    entityType: "notice",
    entityId: "notice-2",
    details: "Bookmarked notice: Mid-Term Examination Schedule",
    createdAt: new Date("2024-02-02"),
  },
];

const DATE_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "publishedAt",
  "expiresAt",
  "scheduledAt",
  "readAt",
  "acknowledgedAt",
]);

type StoreShape = {
  institutions: Institution[];
  departments: Department[];
  classes: Class[];
  users: User[];
  notices: Notice[];
  noticeReadStatus: NoticeReadStatus[];
  noticeAcknowledgements: NoticeAcknowledgement[];
  bookmarks: Bookmark[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
};

const defaultStore: StoreShape = {
  institutions: [...mockInstitutions],
  departments: [...mockDepartments],
  classes: [...mockClasses],
  users: [...mockUsers],
  notices: [...mockNotices],
  noticeReadStatus: [...mockNoticeReadStatus],
  noticeAcknowledgements: [...mockNoticeAcknowledgements],
  bookmarks: [...mockBookmarks],
  notifications: [...mockNotifications],
  activityLogs: [...mockActivityLogs],
};

function reviveDates(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reviveDates);
  }

  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const record = value as Record<string, unknown>;
    const revived: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(record)) {
      if (DATE_KEYS.has(key) && typeof entry === "string") {
        revived[key] = new Date(entry);
      } else {
        revived[key] = reviveDates(entry);
      }
    }

    return revived;
  }

  return value;
}

function cloneStoreValue<T>(value: T): T {
  return reviveDates(JSON.parse(JSON.stringify(value))) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function loadStore(): StoreShape {
  const stored = getStoreValue<StoreShape>("dataStore");
  if (!stored) {
    const seeded = cloneStoreValue(defaultStore);
    setStoreValue("dataStore", seeded);
    return seeded;
  }

  const revived = reviveDates(stored) as StoreShape;
  let changed = false;
  revived.noticeAcknowledgements = revived.noticeAcknowledgements ?? [];
  revived.notifications = revived.notifications ?? [];
  revived.activityLogs = revived.activityLogs ?? [];
  revived.bookmarks = revived.bookmarks ?? [];
  revived.noticeReadStatus = revived.noticeReadStatus ?? [];

  for (const seededInstitution of defaultStore.institutions) {
    const existingInstitution = revived.institutions.find(institution => institution.id === seededInstitution.id);
    if (!existingInstitution) {
      revived.institutions.push(cloneStoreValue(seededInstitution));
      changed = true;
      continue;
    }

    if (
      existingInstitution.name !== seededInstitution.name ||
      existingInstitution.code !== seededInstitution.code ||
      existingInstitution.address !== seededInstitution.address ||
      existingInstitution.phone !== seededInstitution.phone ||
      existingInstitution.email !== seededInstitution.email ||
      existingInstitution.isActive !== seededInstitution.isActive
    ) {
      existingInstitution.name = seededInstitution.name;
      existingInstitution.code = seededInstitution.code;
      existingInstitution.address = seededInstitution.address;
      existingInstitution.phone = seededInstitution.phone;
      existingInstitution.email = seededInstitution.email;
      existingInstitution.isActive = seededInstitution.isActive;
      changed = true;
    }
  }

  for (const seededDepartment of defaultStore.departments) {
    if (!revived.departments.some(department => department.id === seededDepartment.id)) {
      revived.departments.push(cloneStoreValue(seededDepartment));
      changed = true;
    }
  }

  for (const seededClass of defaultStore.classes) {
    if (!revived.classes.some(classItem => classItem.id === seededClass.id)) {
      revived.classes.push(cloneStoreValue(seededClass));
      changed = true;
    }
  }

  // Keep seeded users available in persisted environments without overwriting existing edits.
  for (const seededUser of defaultStore.users) {
    if (
      !revived.users.some(
        (user) => user.id === seededUser.id || user.email === seededUser.email,
      )
    ) {
      revived.users.push(cloneStoreValue(seededUser));
      changed = true;
      continue;
    }

    const existingUser = revived.users.find(
      (user) => user.id === seededUser.id || user.email === seededUser.email,
    );
    if (existingUser && !existingUser.preferredLanguage) {
      existingUser.preferredLanguage = seededUser.preferredLanguage;
      changed = true;
    }
  }

  for (const seededNotice of defaultStore.notices) {
    const existingNotice = revived.notices.find(notice => notice.id === seededNotice.id);
    if (!existingNotice) {
      revived.notices.push(cloneStoreValue(seededNotice));
      changed = true;
      continue;
    }

    const nextCategory = existingNotice.category ?? seededNotice.category ?? "other";
    const nextSummary = existingNotice.summary ?? seededNotice.summary;
    const nextTranslations = existingNotice.translations ?? seededNotice.translations;
    const nextRequiresAcknowledgement =
      existingNotice.requiresAcknowledgement ?? seededNotice.requiresAcknowledgement ?? false;
    const nextAcknowledgementDeadline =
      existingNotice.acknowledgementDeadline ?? seededNotice.acknowledgementDeadline;

    if (
      existingNotice.category !== nextCategory ||
      existingNotice.summary !== nextSummary ||
      existingNotice.translations !== nextTranslations ||
      existingNotice.requiresAcknowledgement !== nextRequiresAcknowledgement ||
      existingNotice.acknowledgementDeadline !== nextAcknowledgementDeadline
    ) {
      existingNotice.category = nextCategory;
      existingNotice.summary = nextSummary;
      existingNotice.translations = nextTranslations;
      existingNotice.requiresAcknowledgement = nextRequiresAcknowledgement;
      existingNotice.acknowledgementDeadline = nextAcknowledgementDeadline;
      changed = true;
    }
  }

  for (const seededAcknowledgement of defaultStore.noticeAcknowledgements) {
    if (
      !revived.noticeAcknowledgements.some(
        acknowledgement =>
          acknowledgement.noticeId === seededAcknowledgement.noticeId &&
          acknowledgement.userId === seededAcknowledgement.userId,
      )
    ) {
      revived.noticeAcknowledgements.push(cloneStoreValue(seededAcknowledgement));
      changed = true;
    }
  }

  if (changed) {
    setStoreValue("dataStore", revived);
  }
  return revived;
}

const rawStore = loadStore();

function persistStore() {
  setStoreValue("dataStore", rawStore);
}

function createDeepProxy<T extends object>(
  target: T,
  onChange: () => void,
  seen = new WeakMap<object, object>(),
): T {
  if (seen.has(target)) {
    return seen.get(target) as T;
  }

  const proxy = new Proxy(target, {
    get(currentTarget, property, receiver) {
      const value = Reflect.get(currentTarget, property, receiver);

      if (Array.isArray(value) || isPlainObject(value)) {
        return createDeepProxy(value as object, onChange, seen);
      }

      return value;
    },
    set(currentTarget, property, value, receiver) {
      const result = Reflect.set(currentTarget, property, value, receiver);
      onChange();
      return result;
    },
    deleteProperty(currentTarget, property) {
      const result = Reflect.deleteProperty(currentTarget, property);
      onChange();
      return result;
    },
  });

  seen.set(target, proxy);
  return proxy;
}

export const dataStore = createDeepProxy(rawStore, persistStore);
