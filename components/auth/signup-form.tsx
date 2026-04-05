'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, Lock, User as UserIcon, Phone, School, Building2, GraduationCap, AlertCircle } from 'lucide-react';
import { LANGUAGE_OPTIONS, ROLE_DASHBOARDS } from '@/lib/constants';
import type { LanguageCode, UserRole } from '@/types';

type InstitutionOption = { id: string; name: string; code: string };
type DepartmentOption = { id: string; name: string; code: string; institutionId: string };
type ClassOption = {
  id: string;
  name: string;
  code: string;
  institutionId: string;
  departmentId: string;
  year: number;
  section?: string;
};

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student' as UserRole,
    preferredLanguage: 'en' as LanguageCode,
    institutionId: '',
    departmentId: '',
    classId: '',
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetch('/api/auth/signup-options');
        const data = await response.json();
        setInstitutions(data.institutions || []);
        setDepartments(data.departments || []);
        setClasses(data.classes || []);
      } catch {
        setError('Unable to load registration options');
      }
    };

    loadOptions();
  }, []);

  const filteredDepartments = useMemo(
    () => departments.filter(department => department.institutionId === formData.institutionId),
    [departments, formData.institutionId]
  );

  const filteredClasses = useMemo(
    () =>
      classes.filter(
        classItem =>
          classItem.institutionId === formData.institutionId &&
          classItem.departmentId === formData.departmentId
      ),
    [classes, formData.departmentId, formData.institutionId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.institutionId) {
      setError('Please select an institution');
      return;
    }

    if (!formData.departmentId) {
      setError('Please select a department');
      return;
    }

    if (formData.role === 'student' && !formData.classId) {
      setError('Please select a class');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      const dashboard = ROLE_DASHBOARDS[data.user.role as keyof typeof ROLE_DASHBOARDS];
      router.push(dashboard);
      router.refresh();
    } catch {
      setError('Network error');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Register as a teacher or student
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.trimStart() })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Register As</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  role: value as UserRole,
                  classId: value === 'teacher' ? '' : formData.classId,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Preferred Language</Label>
            <Select
              value={formData.preferredLanguage}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  preferredLanguage: value as LanguageCode,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Institution</Label>
              <div className="relative">
                <School className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.institutionId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      institutionId: value,
                      departmentId: '',
                      classId: '',
                    })
                  }
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map(institution => (
                      <SelectItem key={institution.id} value={institution.id}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      departmentId: value,
                      classId: '',
                    })
                  }
                  disabled={!formData.institutionId}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map(department => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {formData.role === 'student' && (
            <div className="space-y-2">
              <Label>Class</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  disabled={!formData.departmentId}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map(classItem => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
