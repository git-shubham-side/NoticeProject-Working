'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { Department, Institution } from '@/types';

interface DepartmentFormProps {
  department?: Department | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepartmentForm({
  department,
  open,
  onClose,
  onSuccess,
}: DepartmentFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [formData, setFormData] = useState({
    name: department?.name || '',
    code: department?.code || '',
    institutionId: department?.institutionId || user?.institutionId || '',
    isActive: department?.isActive ?? true,
  });

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetch('/api/institutions')
        .then((res) => res.json())
        .then((data) => setInstitutions(data.institutions || []));
    }
  }, [user]);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        code: department.code,
        institutionId: department.institutionId,
        isActive: department.isActive,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        institutionId: user?.institutionId || '',
        isActive: true,
      });
    }
  }, [department, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = department
        ? `/api/departments/${department.id}`
        : '/api/departments';
      const method = department ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save department');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {department ? 'Edit Department' : 'Create Department'}
          </DialogTitle>
          <DialogDescription>
            {department
              ? 'Update the department details below.'
              : 'Fill in the details to create a new department.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {user?.role === 'super_admin' && (
              <div className="grid gap-2">
                <Label htmlFor="institution">Institution *</Label>
                <Select
                  value={formData.institutionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, institutionId: value })
                  }
                  disabled={!!department}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g., CS"
                required
              />
            </div>
            {department && (
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {department ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
