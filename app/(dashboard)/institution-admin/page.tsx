'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentNotices } from '@/components/dashboard/recent-notices';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Users, FileText, FolderTree, GraduationCap, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { Notice, ActivityLog, User } from '@/types';

interface DashboardData {
  stats: {
    totalDepartments: number;
    totalClasses: number;
    totalUsers: number;
    totalNotices: number;
    activeNotices: number;
  };
  recentNotices: Notice[];
  recentActivity: (ActivityLog & { user?: User })[];
}

export default function InstitutionAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/institution-admin');
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
        <h2 className="text-2xl font-bold tracking-tight">Institution Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your institution&apos;s departments, classes, and notices
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Departments"
          value={data.stats.totalDepartments}
          icon={FolderTree}
          description="In your institution"
        />
        <StatsCard
          title="Classes"
          value={data.stats.totalClasses}
          icon={GraduationCap}
          description="Total classes"
        />
        <StatsCard
          title="Users"
          value={data.stats.totalUsers}
          icon={Users}
          description="Staff & students"
        />
        <StatsCard
          title="Total Notices"
          value={data.stats.totalNotices}
          icon={FileText}
          description="All notices"
        />
        <StatsCard
          title="Active Notices"
          value={data.stats.activeNotices}
          icon={FileText}
          description="Currently published"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentNotices notices={data.recentNotices} />
        <ActivityFeed activities={data.recentActivity} />
      </div>
    </div>
  );
}
