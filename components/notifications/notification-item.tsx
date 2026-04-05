"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Bell,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  X
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { Notification } from "@/types"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDismiss?: (id: string) => void
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getIcon = () => {
    if (notification.priority === "urgent") {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }

    switch (notification.type) {
      case "notice":
        return <FileText className="h-4 w-4" />
      case "reminder":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "system":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getIconBackground = () => {
    if (notification.priority === "urgent") {
      return "bg-red-100 dark:bg-red-900/30"
    }

    switch (notification.type) {
      case "reminder":
        return "bg-orange-100 dark:bg-orange-900/30"
      case "system":
        return "bg-blue-100 dark:bg-blue-900/30"
      default:
        return "bg-muted"
    }
  }

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const content = (
    <div
      className={cn(
        "group relative flex gap-3 rounded-lg border p-4 transition-colors",
        !notification.isRead && "border-primary/20 bg-primary/5",
        notification.isRead && "hover:bg-muted/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", getIconBackground())}>
        {getIcon()}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              !notification.isRead && "font-medium"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>

        {notification.message && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {notification.message}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
          {notification.sender && (
            <>
              <span>&bull;</span>
              <span>from {notification.sender.name}</span>
            </>
          )}
        </div>
      </div>

      {isHovered && onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDismiss(notification.id)
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    )
  }

  return content
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onDismiss?: (id: string) => void
  onMarkAllAsRead?: () => void
  emptyMessage?: string
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onDismiss,
  onMarkAllAsRead,
  emptyMessage = "No notifications"
}: NotificationListProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && onMarkAllAsRead && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  )
}
