"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { NotificationList } from "@/components/notifications/notification-item"
import { subscribeToFirebaseNotifications } from "@/lib/firebase/notifications-client"
import { clearStoredBrowserPushToken, getStoredBrowserPushToken, registerBrowserPushToken } from "@/lib/firebase/messaging"
import { useAuth } from "@/context/auth-context"
import { Bell, Settings, Inbox, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import type { Notification, NotificationPreferences } from "@/types"

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [settings, setSettings] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    notifyNewNotices: true,
    notifyUrgent: true,
    notifyReminders: true,
    dailyDigest: false,
  })

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notificationsResponse, preferencesResponse] = await Promise.all([
          fetch("/api/notifications"),
          fetch("/api/notification-preferences"),
        ])

        const notificationsData = await notificationsResponse.json()
        const preferencesData = await preferencesResponse.json()

        setNotifications(notificationsData.notifications || [])
        if (preferencesData.preferences) {
          setSettings(preferencesData.preferences)
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    if (!user) {
      return
    }

    const unsubscribe = subscribeToFirebaseNotifications(user.id, (nextNotifications) => {
      setNotifications(nextNotifications)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [user])

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleDismiss = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const updatePreferences = async (next: NotificationPreferences) => {
    setSettings(next)
    await fetch("/api/notification-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    })
  }

  const handlePushPreferenceChange = async (checked: boolean) => {
    const next = { ...settings, pushNotifications: checked }
    await updatePreferences(next)

    if (!checked) {
      const token = getStoredBrowserPushToken()
      if (token) {
        await fetch("/api/notifications/device-token", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        clearStoredBrowserPushToken()
      }
      return
    }

    const token = await registerBrowserPushToken()
    if (!token) {
      alert("Push notification setup failed. Check browser notification permission and Firebase Web Push configuration.");
      return
    }

    await fetch("/api/notifications/device-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    alert("Push notifications enabled for this browser/device.")
  }

  const filteredNotifications = notifications.filter(n => {
    switch (activeTab) {
      case "unread":
        return !n.isRead
      case "urgent":
        return n.priority === "urgent"
      case "reminders":
        return n.type === "reminder"
      default:
        return true
    }
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const urgentCount = notifications.filter(n => n.priority === "urgent" && !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with the latest notices and alerts
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Inbox className="h-4 w-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <Bell className="h-4 w-4" />
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="urgent" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Urgent
            {urgentCount > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {urgentCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2">
            <Clock className="h-4 w-4" />
            Reminders
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <NotificationList
              notifications={filteredNotifications}
              onMarkAsRead={handleMarkAsRead}
              onDismiss={handleDismiss}
              onMarkAllAsRead={handleMarkAllAsRead}
              emptyMessage="You're all caught up! No notifications."
            />
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={handleMarkAsRead}
            onDismiss={handleDismiss}
            onMarkAllAsRead={handleMarkAllAsRead}
            emptyMessage="No unread notifications"
          />
        </TabsContent>

        <TabsContent value="urgent" className="mt-6">
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={handleMarkAsRead}
            onDismiss={handleDismiss}
            onMarkAllAsRead={handleMarkAllAsRead}
            emptyMessage="No urgent notifications"
          />
        </TabsContent>

        <TabsContent value="reminders" className="mt-6">
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={handleMarkAsRead}
            onDismiss={handleDismiss}
            onMarkAllAsRead={handleMarkAllAsRead}
            emptyMessage="No reminders"
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      void updatePreferences({ ...settings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      void handlePushPreferenceChange(checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a daily summary email
                    </p>
                  </div>
                  <Switch
                    checked={settings.dailyDigest}
                    onCheckedChange={(checked) =>
                      void updatePreferences({ ...settings, dailyDigest: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Notices</Label>
                    <p className="text-sm text-muted-foreground">
                      When new notices are published
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyNewNotices}
                    onCheckedChange={(checked) =>
                      void updatePreferences({ ...settings, notifyNewNotices: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Urgent Notices</Label>
                    <p className="text-sm text-muted-foreground">
                      High priority and urgent notices
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyUrgent}
                    onCheckedChange={(checked) =>
                      void updatePreferences({ ...settings, notifyUrgent: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Deadline and event reminders
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyReminders}
                    onCheckedChange={(checked) =>
                      void updatePreferences({ ...settings, notifyReminders: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
