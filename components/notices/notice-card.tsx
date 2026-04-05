'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  Eye,
  MoreVertical,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { NOTICE_PRIORITIES, NOTICE_TARGET_TYPES } from '@/lib/constants';
import { formatDistanceToNow, format } from 'date-fns';
import type { Notice, User } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoticeCardProps {
  notice: Notice & { author?: User; isRead?: boolean; isBookmarked?: boolean };
  variant?: 'default' | 'compact';
  onBookmarkToggle?: (noticeId: string, isBookmarked: boolean) => void;
  onMarkAsRead?: (noticeId: string) => void;
  onDelete?: (noticeId: string) => void;
  canDelete?: boolean;
  showAuthor?: boolean;
}

export function NoticeCard({
  notice,
  variant = 'default',
  onBookmarkToggle,
  onMarkAsRead,
  onDelete,
  canDelete = false,
  showAuthor = true,
}: NoticeCardProps) {
  const getPriorityBadge = () => {
    const priority = NOTICE_PRIORITIES.find(p => p.value === notice.priority);
    if (!priority) return null;
    
    return (
      <Badge
        variant={notice.priority === 'urgent' ? 'destructive' : 'outline'}
        className="text-xs"
      >
        {priority.label}
      </Badge>
    );
  };

  const getTargetBadge = () => {
    const target = NOTICE_TARGET_TYPES.find(t => t.value === notice.targetType);
    if (!target) return null;
    
    return (
      <Badge variant="secondary" className="text-xs">
        {target.label}
      </Badge>
    );
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

  const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();
  const cardDescriptionClass = variant === 'compact' ? 'line-clamp-1 mb-2' : 'line-clamp-2 mb-4';

  return (
    <Card className={`transition-all hover:shadow-md ${!notice.isRead && notice.isPublished ? 'border-l-4 border-l-primary' : ''} ${isExpired ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getPriorityBadge()}
              {getTargetBadge()}
              {!notice.isPublished && (
                <Badge variant="outline" className="text-xs">Draft</Badge>
              )}
              {isExpired && (
                <Badge variant="secondary" className="text-xs">Expired</Badge>
              )}
            </div>
            <Link
              href={`/notices/${notice.id}`}
              onClick={() => {
                if (!notice.isRead && onMarkAsRead) {
                  onMarkAsRead(notice.id);
                }
              }}
            >
              <CardTitle className="text-lg hover:text-primary transition-colors line-clamp-1">
                {notice.title}
              </CardTitle>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {onBookmarkToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  onBookmarkToggle(notice.id, Boolean(notice.isBookmarked));
                }}
                className="flex-shrink-0"
              >
                {notice.isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            )}
            {canDelete && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(notice.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Notice
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className={cardDescriptionClass}>
          {notice.content}
        </CardDescription>
        
        {notice.attachments.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <Paperclip className="h-4 w-4" />
            <span>{notice.attachments.length} attachment{notice.attachments.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between">
        {showAuthor && notice.author && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(notice.author.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {notice.author.name}
            </span>
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {notice.isRead !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className={`h-4 w-4 ${notice.isRead ? 'text-green-500' : ''}`} />
              <span>{notice.isRead ? 'Read' : 'Unread'}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {notice.publishedAt
                ? formatDistanceToNow(new Date(notice.publishedAt), { addSuffix: true })
                : format(new Date(notice.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
