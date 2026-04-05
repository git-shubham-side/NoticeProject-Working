'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import { NOTICE_PRIORITIES } from '@/lib/constants';
import type { Notice } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface RecentNoticesProps {
  notices: Notice[];
}

export function RecentNotices({ notices }: RecentNoticesProps) {
  const getPriorityColor = (priority: string) => {
    const found = NOTICE_PRIORITIES.find(p => p.value === priority);
    return found?.color || 'bg-slate-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Notices</CardTitle>
          <CardDescription>Latest notices posted</CardDescription>
        </div>
        <Link href="/notices">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notices yet
            </p>
          ) : (
            notices.map((notice) => (
              <Link
                key={notice.id}
                href={`/notices/${notice.id}`}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-md ${getPriorityColor(notice.priority)} text-white`}>
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate">{notice.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {notice.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {notice.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notice.publishedAt
                      ? formatDistanceToNow(new Date(notice.publishedAt), { addSuffix: true })
                      : 'Draft'}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
