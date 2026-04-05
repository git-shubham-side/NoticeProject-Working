import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// GET /api/analytics - Get analytics data
export async function GET(request: Request) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (!sessionToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "30d"
  const type = searchParams.get("type") || "overview"

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

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90

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
