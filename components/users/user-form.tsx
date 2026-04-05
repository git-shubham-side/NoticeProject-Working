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
import { USER_ROLES } from '@/lib/constants';
import type { User, Institution, Department, Class } from '@/types';

interface UserFormProps {
  userItem?: User | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserForm({
  userItem,
  open,
  onClose,
  onSuccess,
}: UserFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState({
    name: userItem?.name || '',
    email: userItem?.email || '',
    password: '',
    role: userItem?.role || 'student',
    institutionId: userItem?.institutionId || user?.institutionId || '',
    departmentId: userItem?.departmentId || '',
    classId: userItem?.classId || '',
    phone: userItem?.phone || '',
    isActive: userItem?.isActive ?? true,
  });

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetch('/api/institutions')
        .then((res) => res.json())
        .then((data) => setInstitutions(data.institutions || []));
    }
  }, [user]);

  useEffect(() => {
    if (formData.institutionId || user?.institutionId) {
      const instId = formData.institutionId || user?.institutionId;
      fetch(`/api/departments?institutionId=${instId}`)
        .then((res) => res.json())
        .then((data) => setDepartments(data.departments || []));
    }
  }, [formData.institutionId, user]);

  useEffect(() => {
    if (formData.departmentId) {
      fetch(`/api/classes?departmentId=${formData.departmentId}`)
        .then((res) => res.json())
        .then((data) => setClasses(data.classes || []));
    } else {
      setClasses([]);
    }
  }, [formData.departmentId]);

  useEffect(() => {
    if (userItem) {
      setFormData({
        name: userItem.name,
        email: userItem.email,
        password: '',
        role: userItem.role,
        institutionId: userItem.institutionId || '',
        departmentId: userItem.departmentId || '',
        classId: userItem.classId || '',
        phone: userItem.phone || '',
        isActive: userItem.isActive,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        institutionId: user?.institutionId || '',
        departmentId: '',
        classId: '',
        phone: '',
        isActive: true,
      });
    }
  }, [userItem, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = userItem ? `/api/users/${userItem.id}` : '/api/users';
      const method = userItem ? 'PUT' : 'POST';

      const payload = { ...formData };
      if (!payload.password && userItem) {
        delete (payload as Record<string, unknown>).password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save user');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const availableRoles = USER_ROLES.filter((role) => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'institution_admin') {
      return role.value !== 'super_admin';
    }
    return false;
  });

  const showInstitutionField = user?.role === 'super_admin';
  const showDepartmentField = ['teacher', 'student'].includes(formData.role);
  const showClassField = formData.role === 'student';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{userItem ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {userItem
              ? 'Update the user details below.'
              : 'Fill in the details to create a new user.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                Password {userItem ? '(leave blank to keep current)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!userItem}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as User['role'], departmentId: '', classId: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showInstitutionField && (
              <div className="grid gap-2">
                <Label htmlFor="institution">Institution</Label>
                <Select
                  value={formData.institutionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, institutionId: value, departmentId: '', classId: '' })
                  }
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
            {showDepartmentField && (
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentId: value, classId: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showClassField && (
              <div className="grid gap-2">
                <Label htmlFor="class">Class</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, classId: value })
                  }
                  disabled={!formData.departmentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {userItem && (
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
              {userItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
