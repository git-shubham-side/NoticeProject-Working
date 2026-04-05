"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { NoticeForm } from "@/components/notices/notice-form"
import { useAuth } from "@/context/auth-context"
import { ArrowLeft } from "lucide-react"
import { useEffect } from "react"

export default function CreateNoticePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      const canCreate = user.role === "super_admin" || 
                        user.role === "institution_admin" || 
                        user.role === "teacher"
      if (!canCreate) {
        router.push("/notices")
      }
    }
  }, [user, isLoading, router])

  const handleSuccess = () => {
    router.push("/notices")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <h1 className="text-3xl font-bold tracking-tight">Create Notice</h1>
          <p className="text-muted-foreground">
            Create a new notice and target specific audiences
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        <NoticeForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
