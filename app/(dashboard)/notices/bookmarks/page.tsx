"use client"

import { NoticeList } from "@/components/notices/notice-list"
import { useAuth } from "@/context/auth-context"
import { Bookmark } from "lucide-react"

export default function BookmarksPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Bookmark className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bookmarked Notices</h1>
            <p className="text-muted-foreground">
              Notices you have saved for later
            </p>
          </div>
        </div>
      </div>

      <NoticeList
        userRole={user?.role}
        feedType="bookmarked"
        showFilters={true}
      />
    </div>
  )
}
