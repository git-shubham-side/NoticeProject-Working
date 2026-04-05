'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentNotices } from '@/components/dashboard/recent-notices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Bookmark, Bell, AlertCircle, Eye, Clock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import type { Notice, Notification } from '@/types';

interface DashboardData {
  stats: {
    totalNotices: number;
    unreadNotices: number;
    bookmarkedNotices: number;
    unreadNotifications: number;
  };
  recentNotices: Notice[];
  recentNotifications: Notification[];
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/student');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-muted-foreground">
          Stay updated with the latest notices and announcements
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Notices"
          value={data.stats.totalNotices}
          icon={FileText}
          description="Available to you"
        />
        <StatsCard
          title="Unread"
          value={data.stats.unreadNotices}
          icon={Eye}
          description="Yet to read"
        />
        <StatsCard
          title="Bookmarked"
          value={data.stats.bookmarkedNotices}
          icon={Bookmark}
          description="Saved notices"
        />
        <StatsCard
          title="Notifications"
          value={data.stats.unreadNotifications}
          icon={Bell}
          description="Unread alerts"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentNotices notices={data.recentNotices} />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Latest alerts and updates</CardDescription>
            </div>
            <Link href="/notifications">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications yet
                </p>
              ) : (
                data.recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${notification.isRead ? 'bg-muted' : 'bg-primary/10'}`}>
                        {notification.type === 'notice' ? (
                          <FileText className={`h-4 w-4 ${notification.isRead ? 'text-muted-foreground' : 'text-primary'}`} />
                        ) : notification.type === 'reminder' ? (
                          <Clock className={`h-4 w-4 ${notification.isRead ? 'text-muted-foreground' : 'text-primary'}`} />
                        ) : (
                          <Bell className={`h-4 w-4 ${notification.isRead ? 'text-muted-foreground' : 'text-primary'}`} />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
