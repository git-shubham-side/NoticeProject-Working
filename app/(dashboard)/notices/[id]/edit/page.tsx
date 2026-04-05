"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { NoticeForm } from "@/components/notices/notice-form"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/auth-context"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import type { Notice } from "@/types"

export default function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await fetch(`/api/notices/${id}`)
        if (response.ok) {
          const data = await response.json()
          setNotice(data.notice)
        }
      } catch (error) {
        console.error("Failed to fetch notice:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotice()
  }, [id])

  useEffect(() => {
    if (!authLoading && !loading && user && notice) {
      const canEdit = 
        user.role === "super_admin" ||
        (user.role === "institution_admin" && user.institutionId === notice.institutionId) ||
        user.id === notice.authorId

      if (!canEdit) {
        router.push(`/notices/${id}`)
      }
    }
  }, [user, authLoading, loading, notice, id, router])

  const handleSuccess = () => {
    router.push(`/notices/${id}`)
  }

  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-10 w-full" />
          <Skeleton className="mb-4 h-32 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Notice not found</h2>
        <p className="mt-2 text-muted-foreground">The notice you are trying to edit does not exist.</p>
        <Button className="mt-4" onClick={() => router.push("/notices")}>
          Back to Notices
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Notice</h1>
          <p className="text-muted-foreground">
            Update the notice details and targeting
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        <NoticeForm notice={notice} onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
