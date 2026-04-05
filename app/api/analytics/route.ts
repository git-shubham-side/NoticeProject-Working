import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { dataStore } from "@/lib/mock-data"
import type { Notice } from "@/types"

// GET /api/analytics - Get analytics data
export async function GET(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "30d"
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90

  if (user.role === "teacher") {
    return NextResponse.json(buildTeacherAnalytics(user.id, days))
  }

  // Generate mock analytics data
  const generateTrendData = (days: number) => {
    const data = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split("T")[0],
        notices: Math.floor(Math.random() * 10) + 1,
        views: Math.floor(Math.random() * 500) + 100,
        reads: Math.floor(Math.random() * 400) + 50,
      })
    }
    return data
  }

  const analytics = {
    overview: {
      totalNotices: 156,
      totalViews: 12453,
      totalReads: 8934,
      readRate: 71.7,
      activeUsers: 342,
      avgTimeToRead: "2.5 min",
      trends: {
        notices: 12.5,
        views: 8.3,
        reads: 15.2,
        readRate: 3.1,
      }
    },
    noticesByCategory: [
      { name: "Academic", value: 45, color: "#3b82f6" },
      { name: "Administrative", value: 28, color: "#10b981" },
      { name: "Events", value: 18, color: "#f59e0b" },
      { name: "Examinations", value: 15, color: "#ef4444" },
      { name: "Sports", value: 12, color: "#8b5cf6" },
      { name: "Other", value: 8, color: "#6b7280" },
    ],
    noticesByPriority: [
      { name: "Low", value: 45, color: "#22c55e" },
      { name: "Medium", value: 65, color: "#eab308" },
      { name: "High", value: 32, color: "#f97316" },
      { name: "Urgent", value: 14, color: "#ef4444" },
    ],
    trendData: generateTrendData(days),
    topNotices: [
      { id: "1", title: "Mid-term Examination Schedule", views: 1234, reads: 1102, readRate: 89.3 },
      { id: "2", title: "Annual Sports Day Registration", views: 987, reads: 756, readRate: 76.6 },
      { id: "3", title: "Library Hours Extended", views: 876, reads: 654, readRate: 74.7 },
      { id: "4", title: "Scholarship Application Deadline", views: 765, reads: 698, readRate: 91.2 },
      { id: "5", title: "Campus Maintenance Notice", views: 654, reads: 432, readRate: 66.1 },
    ],
    departmentEngagement: [
      { name: "Computer Science", notices: 32, views: 3456, readRate: 78.5 },
      { name: "Electronics", notices: 28, views: 2890, readRate: 72.3 },
      { name: "Mechanical", notices: 24, views: 2234, readRate: 68.9 },
      { name: "Civil", notices: 22, views: 1987, readRate: 65.4 },
      { name: "Electrical", notices: 20, views: 1876, readRate: 70.2 },
    ],
    hourlyDistribution: [
      { hour: "6AM", views: 45 },
      { hour: "8AM", views: 234 },
      { hour: "10AM", views: 567 },
      { hour: "12PM", views: 432 },
      { hour: "2PM", views: 654 },
      { hour: "4PM", views: 543 },
      { hour: "6PM", views: 321 },
      { hour: "8PM", views: 234 },
      { hour: "10PM", views: 123 },
    ],
  }

  return NextResponse.json(analytics)
}

function buildTeacherAnalytics(teacherId: string, days: number) {
  const teacherNotices = dataStore.notices
    .filter(notice => notice.authorId === teacherId && notice.isPublished)
    .sort((a, b) => new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime())

  const readAnalytics = teacherNotices.map(notice => getNoticeReadAnalytics(notice))
  const totalNotices = teacherNotices.length
  const totalReads = readAnalytics.reduce((sum, item) => sum + item.readCount, 0)
  const totalTargets = readAnalytics.reduce((sum, item) => sum + item.totalStudents, 0)
  const totalUnread = Math.max(0, totalTargets - totalReads)
  const readRate = totalTargets > 0 ? Number(((totalReads / totalTargets) * 100).toFixed(1)) : 0
  const recentTrendData = buildTeacherTrendData(teacherNotices, days)

  return {
    overview: {
      totalNotices,
      totalViews: totalTargets,
      totalReads,
      readRate,
      activeUsers: readAnalytics.filter(item => item.readCount > 0).length,
      avgTimeToRead: `${Math.max(1, Math.round(readRate / 10))} hrs`,
      trends: {
        notices: 0,
        views: 0,
        reads: 0,
        readRate: 0,
      },
    },
    noticesByCategory: buildNoticeCategoryDistribution(teacherNotices),
    noticesByPriority: buildNoticePriorityDistribution(teacherNotices),
    trendData: recentTrendData,
    topNotices: readAnalytics
      .slice()
      .sort((a, b) => b.readRate - a.readRate)
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        title: item.title,
        views: item.totalStudents,
        reads: item.readCount,
        readRate: item.readRate,
      })),
    departmentEngagement: [],
    hourlyDistribution: [],
    teacherReadAnalytics: readAnalytics,
    teacherReadDistribution: [
      { name: "Read", value: totalReads, color: "#10b981" },
      { name: "Unread", value: totalUnread, color: "#f97316" },
    ],
  }
}

function getNoticeReadAnalytics(notice: Notice) {
  const targetedStudentIds = dataStore.users
    .filter(user => {
      if (user.role !== "student") {
        return false
      }

      switch (notice.targetType) {
        case "all":
          return true
        case "institution":
          return notice.targetIds.includes(user.institutionId || "")
        case "department":
          return notice.targetIds.includes(user.departmentId || "")
        case "class":
          return notice.targetIds.includes(user.classId || "")
        case "specific_users":
          return notice.targetIds.includes(user.id)
        default:
          return false
      }
    })
    .map(student => student.id)

  const readStudentIds = new Set(
    dataStore.noticeReadStatus
      .filter(status => status.noticeId === notice.id && targetedStudentIds.includes(status.userId))
      .map(status => status.userId)
  )

  const totalStudents = targetedStudentIds.length
  const readCount = readStudentIds.size
  const unreadCount = Math.max(0, totalStudents - readCount)

  return {
    id: notice.id,
    title: notice.title,
    totalStudents,
    readCount,
    unreadCount,
    readRate: totalStudents > 0 ? Number(((readCount / totalStudents) * 100).toFixed(1)) : 0,
  }
}

function buildTeacherTrendData(notices: Notice[], days: number) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  return Array.from({ length: days }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)

    const dayKey = day.toISOString().split("T")[0]
    const noticesForDay = notices.filter(notice => {
      const publishedDate = new Date(notice.publishedAt || notice.createdAt)
      return publishedDate.toISOString().split("T")[0] === dayKey
    })

    const reads = noticesForDay.reduce((sum, notice) => sum + getNoticeReadAnalytics(notice).readCount, 0)
    const targets = noticesForDay.reduce((sum, notice) => sum + getNoticeReadAnalytics(notice).totalStudents, 0)

    return {
      date: dayKey,
      notices: noticesForDay.length,
      views: targets,
      reads,
    }
  })
}

function buildNoticeCategoryDistribution(notices: Notice[]) {
  const colorMap: Record<string, string> = {
    academic: "#3b82f6",
    administrative: "#10b981",
    events: "#f59e0b",
    examinations: "#ef4444",
    sports: "#8b5cf6",
    cultural: "#ec4899",
    placement: "#06b6d4",
    other: "#6b7280",
  }

  const counts = new Map<string, number>()
  notices.forEach((notice) => {
    const key = notice.category || "other"
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return [...counts.entries()].map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: colorMap[name] || "#6b7280",
  }))
}

function buildNoticePriorityDistribution(notices: Notice[]) {
  const colorMap: Record<string, string> = {
    low: "#22c55e",
    medium: "#eab308",
    high: "#f97316",
    urgent: "#ef4444",
  }

  const counts = new Map<string, number>()
  notices.forEach((notice) => {
    counts.set(notice.priority, (counts.get(notice.priority) || 0) + 1)
  })

  return [...counts.entries()].map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: colorMap[name] || "#6b7280",
  }))
}
