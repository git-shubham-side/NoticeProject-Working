'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityLog, User } from '@/types';

interface ActivityFeedProps {
  activities: (ActivityLog & { user?: User })[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { icon: '+', color: 'bg-green-500' };
      case 'UPDATE':
        return { icon: '~', color: 'bg-blue-500' };
      case 'DELETE':
        return { icon: '-', color: 'bg-red-500' };
      case 'READ':
        return { icon: 'R', color: 'bg-slate-500' };
      case 'BOOKMARK':
        return { icon: 'B', color: 'bg-amber-500' };
      default:
        return { icon: '?', color: 'bg-gray-500' };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            activities.map((activity) => {
              const actionStyle = getActionIcon(activity.action);
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full ${actionStyle.color} text-white text-xs flex items-center justify-center`}
                    >
                      {actionStyle.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activity.user?.name || 'Unknown'}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        {activity.details || `${activity.action} ${activity.entityType}`}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
