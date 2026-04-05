"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NoticeList } from "@/components/notices/notice-list"
import { useAuth } from "@/context/auth-context"
import { Plus, FileText, Bookmark, Eye } from "lucide-react"

export default function NoticesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("all")

  const canCreateNotice = user?.role === "super_admin" || 
                          user?.role === "institution_admin" || 
                          user?.role === "teacher"

  const showInstitutionFilter = user?.role === "super_admin"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
          <p className="text-muted-foreground">
            {canCreateNotice 
              ? "Manage and create notices for your institution"
              : "View all notices relevant to you"}
          </p>
        </div>
        
        {canCreateNotice && (
          <Button onClick={() => router.push("/notices/create")} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Notice
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            All Notices
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <Eye className="h-4 w-4" />
            Unread
          </TabsTrigger>
          <TabsTrigger value="bookmarked" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Bookmarked
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <NoticeList
            userRole={user?.role}
            showInstitutionFilter={showInstitutionFilter}
            feedType="all"
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <NoticeList
            userRole={user?.role}
            showInstitutionFilter={showInstitutionFilter}
            feedType="unread"
          />
        </TabsContent>

        <TabsContent value="bookmarked" className="mt-6">
          <NoticeList
            userRole={user?.role}
            showInstitutionFilter={showInstitutionFilter}
            feedType="bookmarked"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
