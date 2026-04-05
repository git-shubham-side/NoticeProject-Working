"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Filter,
  FileText,
  User,
  Building2,
  Settings,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Activity
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import type { ActivityLog } from "@/types"

const activityIcons: Record<string, React.ElementType> = {
  notice_created: Plus,
  notice_updated: Edit,
  notice_deleted: Trash2,
  notice_viewed: Eye,
  user_login: LogIn,
  user_logout: LogOut,
  user_created: User,
  user_updated: Edit,
  institution_created: Building2,
  settings_updated: Settings,
}

const activityColors: Record<string, string> = {
  notice_created: "bg-green-100 text-green-600 dark:bg-green-900/30",
  notice_updated: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
  notice_deleted: "bg-red-100 text-red-600 dark:bg-red-900/30",
  notice_viewed: "bg-gray-100 text-gray-600 dark:bg-gray-900/30",
  user_login: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
  user_logout: "bg-orange-100 text-orange-600 dark:bg-orange-900/30",
  user_created: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
  user_updated: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30",
  institution_created: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30",
  settings_updated: "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  })

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        })
        if (typeFilter !== "all") {
          params.set("type", typeFilter)
        }

        const response = await fetch(`/api/activity-logs?${params.toString()}`)
        const data = await response.json()
        setLogs(data.logs || [])
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        })
      } catch (error) {
        console.error("Failed to fetch activity logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [page, typeFilter])

  const filteredLogs = search
    ? logs.filter(
        (log) =>
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.details?.toLowerCase().includes(search.toLowerCase()) ||
          log.user?.name.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const getIcon = (type: string) => {
    const Icon = activityIcons[type] || Activity
    return Icon
  }

  const getActionLabel = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">
          Track all system activities and user actions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                {pagination.total} total activities recorded
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[200px] pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="notice_created">Notice Created</SelectItem>
                  <SelectItem value="notice_updated">Notice Updated</SelectItem>
                  <SelectItem value="notice_deleted">Notice Deleted</SelectItem>
                  <SelectItem value="user_login">User Login</SelectItem>
                  <SelectItem value="user_logout">User Logout</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No activities found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No activities match your current filters.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 h-full w-px bg-border" />
              
              <div className="space-y-6">
                {filteredLogs.map((log, index) => {
                  const logType = log.type || `${log.entityType}_${log.action.toLowerCase()}`
                  const Icon = getIcon(logType)
                  const iconColor = activityColors[logType] || "bg-muted text-muted-foreground"
                  
                  return (
                    <div key={log.id} className="relative flex gap-4 pl-10">
                      <div className={`absolute left-0 flex h-10 w-10 items-center justify-center rounded-full ${iconColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 rounded-lg border bg-card p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {log.user?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm">
                                <span className="font-medium">{log.user?.name || "System"}</span>
                                {" "}
                                <span className="text-muted-foreground">{log.action}</span>
                              </p>
                              {log.details && (
                                <p className="text-sm text-muted-foreground">{log.details}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getActionLabel(logType)}
                            </Badge>
                            <span title={format(new Date(log.createdAt), "PPpp")}>
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        {log.metadata && (
                          <div className="mt-3 rounded-md bg-muted/50 p-2 text-xs">
                            <pre className="overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
