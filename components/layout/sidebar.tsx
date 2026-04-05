'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { NAV_ITEMS } from '@/lib/constants';
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  GraduationCap,
  Users,
  FileText,
  BarChart3,
  PlusCircle,
  Bookmark,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Building2,
  FolderTree,
  GraduationCap,
  Users,
  FileText,
  BarChart3,
  PlusCircle,
  Bookmark,
  Bell,
  Settings,
  Activity,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] || [];

  const navContent = (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileOpenChange?.(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <Link
          href="/profile"
          onClick={() => onMobileOpenChange?.(false)}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/profile'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden h-screen flex-col border-r bg-card transition-all duration-300 md:flex',
          collapsed ? 'md:w-16' : 'md:w-64'
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">NoticeBoard</span>
            </Link>
          ) : (
            <FileText className="mx-auto h-6 w-6 text-primary" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', collapsed && 'mx-auto mt-2')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        {navContent}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[86vw] max-w-sm p-0 md:hidden">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              NoticeBoard
            </SheetTitle>
            <SheetDescription>
              Navigate through your dashboard
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            {navContent}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
