"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/auth-context"
import { 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck,
  Calendar, 
  Clock, 
  Download, 
  Edit, 
  Eye,
  FileText, 
  MoreVertical, 
  Share2, 
  Trash2,
  Users,
  Building2,
  GraduationCap,
  AlertTriangle
} from "lucide-react"
import { format } from "date-fns"
import type { LanguageCode, Notice, User } from "@/types"
import { LANGUAGE_OPTIONS, NOTICE_CATEGORIES, NOTICE_PRIORITIES } from "@/lib/constants"
import { getLocalizedNoticeContent } from "@/lib/notice-assistant"

type NoticeDetail = Notice & {
  author?: User
  isRead?: boolean
  isAcknowledged?: boolean
  isBookmarked?: boolean
  readStats?: {
    totalStudents: number
    readCount: number
    unreadCount: number
  }
  acknowledgementStats?: {
    acknowledgedCount: number
    pendingCount: number
  }
  localized?: {
    title: string
    content: string
    summary?: string
    language: LanguageCode
    translated: boolean
  }
  audienceLabels?: {
    institutions?: string[]
    departments?: string[]
    classes?: string[]
    users?: string[]
    roles?: string[]
  }
}

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [notice, setNotice] = useState<NoticeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("en")

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await fetch(`/api/notices/${id}`)
        if (response.ok) {
          const data = await response.json()
          setNotice(data.notice)
          setSelectedLanguage(data.notice.localized?.language || "en")
        }
      } catch (error) {
        console.error("Failed to fetch notice:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotice()

    // Mark as read
    fetch(`/api/notices/${id}/read`, { method: "POST" }).catch(() => {})
  }, [id])

  const handleBookmarkToggle = async () => {
    if (!notice) return
    
    try {
      await fetch(`/api/notices/${id}/bookmark`, {
        method: notice.isBookmarked ? "DELETE" : "POST",
      })
      setNotice(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null)
    } catch (error) {
      console.error("Failed to toggle bookmark:", error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/notices/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to delete notice")
      }
      router.push("/notices")
    } catch (error) {
      console.error("Failed to delete notice:", error)
      if (typeof window !== "undefined") {
        window.alert(error instanceof Error ? error.message : "Failed to delete notice.")
      }
    }
  }

  const handleAcknowledge = async () => {
    if (!notice) return

    try {
      const response = await fetch(`/api/notices/${id}/acknowledge`, { method: "POST" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to acknowledge notice")
      }

      setNotice((prev) =>
        prev
          ? {
              ...prev,
              isAcknowledged: true,
              acknowledgementStats: prev.acknowledgementStats
                ? {
                    acknowledgedCount: prev.acknowledgementStats.acknowledgedCount + 1,
                    pendingCount: Math.max(0, prev.acknowledgementStats.pendingCount - 1),
                  }
                : prev.acknowledgementStats,
            }
          : null
      )
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to acknowledge notice.")
    }
  }

  const canManage = user && notice && (
    user.role === "super_admin" ||
    (user.role === "institution_admin" && user.institutionId === notice.institutionId) ||
    user.id === notice.authorId
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/10 text-red-600 border-red-200"
      case "high": return "bg-orange-500/10 text-orange-600 border-orange-200"
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-200"
      default: return "bg-green-500/10 text-green-600 border-green-200"
    }
  }

  const getCategoryLabel = (value: string) => {
    return NOTICE_CATEGORIES.find(c => c.value === value)?.label || value
  }

  const getPriorityLabel = (value: string) => {
    return NOTICE_PRIORITIES.find(p => p.value === value)?.label || value
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-4 h-6 w-3/4" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Notice not found</h2>
        <p className="mt-2 text-muted-foreground">The notice you are looking for does not exist.</p>
        <Button className="mt-4" onClick={() => router.push("/notices")}>
          Back to Notices
        </Button>
      </div>
    )
  }

  const localized = getLocalizedNoticeContent(notice, selectedLanguage)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{getCategoryLabel(notice.category || "other")}</Badge>
              <Badge className={getPriorityColor(notice.priority)}>
                {getPriorityLabel(notice.priority)}
              </Badge>
              {localized.translated && (
                <Badge variant="secondary">
                  {LANGUAGE_OPTIONS.find(option => option.value === selectedLanguage)?.label}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">{localized.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBookmarkToggle}
          >
            {notice.isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>

          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/notices/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Notice
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Notice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Language</p>
                <p className="text-sm text-muted-foreground">
                  View this notice in English, Hindi, or Marathi
                </p>
              </div>
              <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as LanguageCode)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {localized.summary && (
              <div className="mb-6 rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Quick Summary
                </p>
                <p className="mt-2 text-sm text-foreground">{localized.summary}</p>
              </div>
            )}

            <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
              {localized.content}
            </div>

            {notice.attachments && notice.attachments.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="mb-4 font-semibold">Attachments</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {notice.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {typeof attachment.size === "number" ? `${attachment.size} bytes` : attachment.size}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild className="self-end sm:self-auto">
                          <a href={attachment.url} download={attachment.name} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Notice Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {notice.author?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{notice.author?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {notice.author?.role?.replace("_", " ") || "Author"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Published: {format(new Date(notice.publishedAt || notice.createdAt), "PPP")}
                  </span>
                </div>
                
                {notice.expiresAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expires: {format(new Date(notice.expiresAt), "PPP")}</span>
                  </div>
                )}

                {notice.isRead !== undefined && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{notice.isRead ? "Read" : "Unread"}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold">Student Read Status</h3>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Targeted Students</span>
                  <span className="font-semibold">{notice.readStats?.totalStudents ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Read</span>
                  <span className="font-semibold text-green-600">{notice.readStats?.readCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Unread</span>
                  <span className="font-semibold text-orange-600">{notice.readStats?.unreadCount ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {canManage && notice.requiresAcknowledgement && (
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold">Acknowledgement Tracking</h3>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Acknowledged</span>
                  <span className="font-semibold text-green-600">{notice.acknowledgementStats?.acknowledgedCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-semibold text-orange-600">{notice.acknowledgementStats?.pendingCount ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {user?.role === "student" && notice.requiresAcknowledgement && (
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold">Acknowledgement</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This notice requires acknowledgement from students.
                </p>
                <Button onClick={handleAcknowledge} disabled={notice.isAcknowledged}>
                  {notice.isAcknowledged ? "Acknowledged" : "Acknowledge Notice"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Target Audience</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {notice.targetType === "all" && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Audience</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        All users
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {notice.audienceLabels?.institutions && notice.audienceLabels.institutions.length > 0 && (
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Institutions</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {notice.audienceLabels.institutions.map((inst, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {inst}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {notice.audienceLabels?.departments && notice.audienceLabels.departments.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Departments</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {notice.audienceLabels.departments.map((dept, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {notice.audienceLabels?.classes && notice.audienceLabels.classes.length > 0 && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Classes</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {notice.audienceLabels.classes.map((cls, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {notice.audienceLabels?.users && notice.audienceLabels.users.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Specific Users</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {notice.audienceLabels.users.map((targetUser, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {targetUser}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {notice.audienceLabels?.roles && notice.audienceLabels.roles.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Roles</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {notice.audienceLabels.roles.map((role, i) => (
                        <Badge key={i} variant="secondary" className="text-xs capitalize">
                          {role.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
