"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { NoticeCard } from "./notice-card"
import { NoticeFilters, type FilterValues } from "./notice-filters"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid3X3, List, RefreshCw } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { Notice, User } from "@/types"

type NoticeListItem = Notice & {
  author?: User
  isRead?: boolean
  isBookmarked?: boolean
  readStats?: {
    totalStudents: number
    readCount: number
    unreadCount: number
  }
}

interface NoticeListProps {
  userRole?: string
  showFilters?: boolean
  showInstitutionFilter?: boolean
  feedType?: "all" | "bookmarked" | "unread"
  initialNotices?: NoticeListItem[]
}

export function NoticeList({
  userRole = "student",
  showFilters = true,
  showInstitutionFilter = false,
  feedType = "all",
  initialNotices,
}: NoticeListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [notices, setNotices] = useState<NoticeListItem[]>(initialNotices || [])
  const [loading, setLoading] = useState(!initialNotices)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState<FilterValues | null>(null)

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (feedType === "bookmarked") {
        params.set("bookmarked", "true")
      } else if (feedType === "unread") {
        params.set("unread", "true")
      }
      
      if (filters) {
        if (filters.search) params.set("search", filters.search)
        if (filters.category && filters.category !== "all") params.set("category", filters.category)
        if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority)
        if (filters.status && filters.status !== "all") params.set("status", filters.status)
        if (filters.institutionId && filters.institutionId !== "all") params.set("institutionId", filters.institutionId)
        if (filters.departmentId && filters.departmentId !== "all") params.set("departmentId", filters.departmentId)
        if (filters.classId && filters.classId !== "all") params.set("classId", filters.classId)
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom.toISOString())
        if (filters.dateTo) params.set("dateTo", filters.dateTo.toISOString())
      }

      const response = await fetch(`/api/notices?${params.toString()}`)
      const data = await response.json()
      setNotices(data.notices || [])
    } catch (error) {
      console.error("Failed to fetch notices:", error)
    } finally {
      setLoading(false)
    }
  }, [feedType, filters])

  useEffect(() => {
    if (!initialNotices) {
      fetchNotices()
    }
  }, [fetchNotices, initialNotices])

  const handleBookmarkToggle = async (noticeId: string, isBookmarked: boolean) => {
    try {
      await fetch(`/api/notices/${noticeId}/bookmark`, {
        method: isBookmarked ? "DELETE" : "POST",
      })
      
      setNotices(prev => 
        prev.map(n => 
          n.id === noticeId ? { ...n, isBookmarked: !isBookmarked } : n
        )
      )

      if (feedType === "bookmarked" && isBookmarked) {
        setNotices(prev => prev.filter(n => n.id !== noticeId))
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error)
    }
  }

  const handleMarkAsRead = async (noticeId: string) => {
    try {
      await fetch(`/api/notices/${noticeId}/read`, {
        method: "POST",
      })
      
      setNotices(prev => 
        prev.map(n => 
          n.id === noticeId ? { ...n, isRead: true } : n
        )
      )

      if (feedType === "unread") {
        setNotices(prev => prev.filter(n => n.id !== noticeId))
      }
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleDelete = async (noticeId: string) => {
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to delete notice")
      }

      setNotices(prev => prev.filter(notice => notice.id !== noticeId))
      if (typeof window !== "undefined") {
        window.alert("Notice deleted successfully.")
      }
      router.refresh()
    } catch (error) {
      console.error("Failed to delete notice:", error)
      if (typeof window !== "undefined") {
        window.alert(error instanceof Error ? error.message : "Failed to delete notice.")
      }
    }
  }

  const canDeleteNotice = (notice: NoticeListItem) => {
    if (!user) return false
    if (user.role === "super_admin") return true
    if (user.role === "institution_admin") return notice.institutionId === user.institutionId
    return user.role === "teacher" && notice.authorId === user.id
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <NoticeFilters
          onFiltersChange={setFilters}
          userRole={userRole}
          showInstitutionFilter={showInstitutionFilter}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${notices.length} notice${notices.length !== 1 ? "s" : ""} found`}
        </p>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchNotices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
            <TabsList className="h-9">
              <TabsTrigger value="grid" className="px-2">
                <Grid3X3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className={viewMode === "grid" 
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
          : "space-y-4"
        }>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-4 h-3 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <List className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No notices found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {feedType === "bookmarked" 
              ? "You haven't bookmarked any notices yet."
              : feedType === "unread"
              ? "You're all caught up! No unread notices."
              : "No notices match your current filters."}
          </p>
        </div>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
          : "space-y-4"
        }>
          {notices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              variant={viewMode === "list" ? "compact" : "default"}
              onBookmarkToggle={handleBookmarkToggle}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              canDelete={canDeleteNotice(notice)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
