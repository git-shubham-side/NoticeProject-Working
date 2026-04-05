'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { DataTable, Column } from '@/components/ui/data-table';
import { ClassForm } from '@/components/classes/class-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { Class, Department } from '@/types';
import { format } from 'date-fns';

interface ClassWithDepartment extends Class {
  department?: Department;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassWithDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);

  const canManage = user?.role === 'super_admin' || user?.role === 'institution_admin';

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDelete = async () => {
    if (!deletingClass) return;

    try {
      const response = await fetch(`/api/classes/${deletingClass.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchClasses();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete class');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setDeletingClass(null);
    }
  };

  const columns: Column<ClassWithDepartment>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (item) => (
        <div className="font-medium">{item.name}</div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
    },
    {
      key: 'department',
      header: 'Department',
      render: (item) => item.department?.name || '-',
    },
    {
      key: 'year',
      header: 'Year',
      render: (item) => `Year ${item.year}`,
    },
    {
      key: 'section',
      header: 'Section',
      render: (item) => item.section || '-',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (item) => format(new Date(item.createdAt), 'MMM d, yyyy'),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            render: (item: ClassWithDepartment) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClass(item);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingClass(item);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]
      : []),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
          <p className="text-muted-foreground">
            Manage classes within departments
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditingClass(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        )}
      </div>

      <DataTable
        data={classes}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search classes..."
      />

      <ClassForm
        classItem={editingClass}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingClass(null);
        }}
        onSuccess={fetchClasses}
      />

      <AlertDialog
        open={!!deletingClass}
        onOpenChange={() => setDeletingClass(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingClass?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
