'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentNotices } from '@/components/dashboard/recent-notices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, PlusCircle, AlertCircle, Send, Clock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { Notice } from '@/types';

interface DashboardData {
  stats: {
    myNotices: number;
    publishedNotices: number;
    draftNotices: number;
    totalStudents: number;
  };
  recentNotices: Notice[];
}

export default function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/teacher');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h2>
          <p className="text-muted-foreground">
            Create and manage notices for your students
          </p>
        </div>
        <Link href="/notices/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Notice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Notices"
          value={data.stats.myNotices}
          icon={FileText}
          description="Total created"
        />
        <StatsCard
          title="Published"
          value={data.stats.publishedNotices}
          icon={Send}
          description="Live notices"
        />
        <StatsCard
          title="Drafts"
          value={data.stats.draftNotices}
          icon={Clock}
          description="Unpublished"
        />
        <StatsCard
          title="Students"
          value={data.stats.totalStudents}
          icon={Users}
          description="In your classes"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentNotices notices={data.recentNotices} />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for teachers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/notices/create" className="block">
              <Button variant="outline" className="w-full justify-start">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Notice
              </Button>
            </Link>
            <Link href="/notices" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View All My Notices
              </Button>
            </Link>
            <Link href="/users" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                View My Students
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
