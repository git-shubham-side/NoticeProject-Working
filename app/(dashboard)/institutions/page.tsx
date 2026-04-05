'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { DataTable, Column } from '@/components/ui/data-table';
import { InstitutionForm } from '@/components/institutions/institution-form';
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
import type { Institution } from '@/types';
import { format } from 'date-fns';

export default function InstitutionsPage() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [deletingInstitution, setDeletingInstitution] = useState<Institution | null>(null);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/institutions');
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions);
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleDelete = async () => {
    if (!deletingInstitution) return;

    try {
      const response = await fetch(`/api/institutions/${deletingInstitution.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchInstitutions();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete institution');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setDeletingInstitution(null);
    }
  };

  const columns: Column<Institution>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-muted-foreground">{item.email}</div>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
    },
    {
      key: 'phone',
      header: 'Phone',
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
    {
      key: 'actions',
      header: '',
      render: (item) => (
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
                setEditingInstitution(item);
                setFormOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setDeletingInstitution(item);
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
          <h2 className="text-2xl font-bold tracking-tight">Institutions</h2>
          <p className="text-muted-foreground">
            Manage all institutions in the system
          </p>
        </div>
        {user?.role === 'super_admin' && (
          <Button
            onClick={() => {
              setEditingInstitution(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Institution
          </Button>
        )}
      </div>

      <DataTable
        data={institutions}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search institutions..."
      />

      <InstitutionForm
        institution={editingInstitution}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingInstitution(null);
        }}
        onSuccess={fetchInstitutions}
      />

      <AlertDialog
        open={!!deletingInstitution}
        onOpenChange={() => setDeletingInstitution(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Institution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingInstitution?.name}&quot;?
              This action cannot be undone and will remove all associated data.
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
