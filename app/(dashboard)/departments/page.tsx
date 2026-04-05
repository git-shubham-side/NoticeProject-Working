'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { DataTable, Column } from '@/components/ui/data-table';
import { DepartmentForm } from '@/components/departments/department-form';
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
import type { Department, Institution } from '@/types';
import { format } from 'date-fns';

interface DepartmentWithInstitution extends Department {
  institution?: Institution;
}

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentWithInstitution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  const canManage = user?.role === 'super_admin' || user?.role === 'institution_admin';

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = async () => {
    if (!deletingDepartment) return;

    try {
      const response = await fetch(`/api/departments/${deletingDepartment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDepartments();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete department');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setDeletingDepartment(null);
    }
  };

  const columns: Column<DepartmentWithInstitution>[] = [
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
    ...(user?.role === 'super_admin'
      ? [
          {
            key: 'institution',
            header: 'Institution',
            render: (item: DepartmentWithInstitution) => item.institution?.name || '-',
          },
        ]
      : []),
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
            render: (item: DepartmentWithInstitution) => (
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
                      setEditingDepartment(item);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingDepartment(item);
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
          <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">
            Manage departments within your institution
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditingDepartment(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      <DataTable
        data={departments}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search departments..."
      />

      <DepartmentForm
        department={editingDepartment}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingDepartment(null);
        }}
        onSuccess={fetchDepartments}
      />

      <AlertDialog
        open={!!deletingDepartment}
        onOpenChange={() => setDeletingDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingDepartment?.name}&quot;?
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
