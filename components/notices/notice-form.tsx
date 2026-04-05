'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Calendar, Sparkles, Languages, Tags } from 'lucide-react';
import { LANGUAGE_OPTIONS, NOTICE_CATEGORIES, NOTICE_PRIORITIES, NOTICE_TARGET_TYPES } from '@/lib/constants';
import type { Notice, Institution, Department, Class, User, Attachment, LanguageCode, NoticeTranslation } from '@/types';

interface NoticeFormProps {
  notice?: Notice | null;
  onSuccess?: () => void;
}

export function NoticeForm({ notice, onSuccess }: NoticeFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [classificationHint, setClassificationHint] = useState<{
    category: string;
    confidence: number;
    reason: string;
  } | null>(null);
  const [translationLanguages, setTranslationLanguages] = useState<LanguageCode[]>(
    notice?.translations?.map(item => item.language) ?? ['hi', 'mr']
  );
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    category: notice?.category || 'other',
    priority: notice?.priority || 'medium',
    summary: notice?.summary || '',
    translations: notice?.translations || ([] as NoticeTranslation[]),
    targetType: notice?.targetType || 'all',
    targetIds: notice?.targetIds || [],
    attachments: notice?.attachments || [],
    requiresAcknowledgement: notice?.requiresAcknowledgement || false,
    acknowledgementDeadline: notice?.acknowledgementDeadline
      ? new Date(notice.acknowledgementDeadline).toISOString().slice(0, 16)
      : '',
    isPublished: notice?.isPublished || false,
    expiresAt: notice?.expiresAt ? new Date(notice.expiresAt).toISOString().slice(0, 16) : '',
    scheduledAt: notice?.scheduledAt ? new Date(notice.scheduledAt).toISOString().slice(0, 16) : '',
    deliveryChannels: {
      inApp: notice?.deliveryChannels?.inApp ?? true,
      email: notice?.deliveryChannels?.email ?? false,
    },
  });

  useEffect(() => {
    // Fetch data for targeting options
    if (user?.role === 'super_admin') {
      fetch('/api/institutions')
        .then(res => res.json())
        .then(data => setInstitutions(data.institutions || []));
    }
    
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => setDepartments(data.departments || []));
    
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => setClasses(data.classes || []));
    
    fetch('/api/users?role=student')
      .then(res => res.json())
      .then(data => setUsers(data.users || []));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = notice ? `/api/notices/${notice.id}` : '/api/notices';
      const method = notice ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        isPublished: publish || formData.isPublished,
        acknowledgementDeadline: formData.acknowledgementDeadline || null,
        expiresAt: formData.expiresAt || null,
        scheduledAt: formData.scheduledAt || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (publish && formData.deliveryChannels.email && !data.deliveryStatus?.emailConfigured) {
          alert('Notice published, but email delivery is not configured yet. Add SMTP settings to enable email sending.');
        }
        onSuccess?.();
        router.push('/notices');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save notice');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetSelect = (id: string) => {
    const current = formData.targetIds;
    if (current.includes(id)) {
      setFormData({ ...formData, targetIds: current.filter(t => t !== id) });
    } else {
      setFormData({ ...formData, targetIds: [...current, id] });
    }
  };

  const handleTranslationLanguageToggle = (language: LanguageCode) => {
    if (language === 'en') return;

    setTranslationLanguages((current) =>
      current.includes(language)
        ? current.filter(item => item !== language)
        : [...current, language]
    );
  };

  const handleAssistantGenerate = async () => {
    setAssistantLoading(true);

    try {
      const response = await fetch('/api/notices/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          category: formData.category,
          languages: translationLanguages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Assistant could not generate a draft');
      }

      setFormData((current) => ({
        ...current,
        title: data.suggestion.polishedTitle,
        content: data.suggestion.polishedContent,
        summary: data.suggestion.summary,
        translations: data.suggestion.translations,
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Assistant generation failed');
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleAutoClassify = async () => {
    setClassificationLoading(true);

    try {
      const response = await fetch('/api/notices/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not classify notice');
      }

      setFormData((current) => ({
        ...current,
        category: data.classification.category,
      }));
      setClassificationHint({
        category: data.classification.category,
        confidence: data.classification.confidence,
        reason: data.classification.reason,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Auto classification failed');
    } finally {
      setClassificationLoading(false);
    }
  };

  const updateTranslation = (language: LanguageCode, key: 'title' | 'content' | 'summary', value: string) => {
    setFormData((current) => ({
      ...current,
      translations: current.translations.map((translation) =>
        translation.language === language ? { ...translation, [key]: value } : translation
      ),
    }));
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsLoading(true);

    try {
      const newAttachments: Attachment[] = await Promise.all(
        Array.from(files).map(async (file, index) => ({
          id: `att-${Date.now()}-${index}`,
          name: file.name,
          url: await readFileAsDataUrl(file),
          type: file.type,
          size: file.size,
        }))
      );

      setFormData((current) => ({
        ...current,
        attachments: [...current.attachments, ...newAttachments],
      }));
    } catch (error) {
      console.error('Failed to prepare attachments:', error);
      alert('One or more files could not be attached.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter(a => a.id !== id),
    });
  };

  const availableTargetTypes = NOTICE_TARGET_TYPES.filter(type => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'institution_admin') {
      return ['all', 'institution', 'department', 'class', 'specific_users'].includes(type.value);
    }
    if (user?.role === 'teacher') {
      return ['department', 'class', 'specific_users'].includes(type.value);
    }
    return false;
  });

  const getTargetOptions = () => {
    switch (formData.targetType) {
      case 'institution':
        return institutions;
      case 'department':
        return departments;
      case 'class':
        return classes;
      case 'specific_users':
        return users;
      default:
        return [];
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Notice Assistant
              </CardTitle>
              <CardDescription>
                Improve the draft, generate a summary, and create multilingual variants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.filter((option) => option.value !== 'en').map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={translationLanguages.includes(option.value) ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => handleTranslationLanguageToggle(option.value)}
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    {option.label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                onClick={handleAssistantGenerate}
                disabled={assistantLoading || isLoading}
                className="w-full sm:w-auto"
              >
                {(assistantLoading || isLoading) && <Spinner className="mr-2 h-4 w-4" />}
                Generate polished draft
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleAutoClassify}
                disabled={classificationLoading || isLoading}
                className="w-full sm:w-auto"
              >
                {(classificationLoading || isLoading) && <Spinner className="mr-2 h-4 w-4" />}
                <Tags className="mr-2 h-4 w-4" />
                Auto classify category
              </Button>
              {classificationHint && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">
                    Suggested category: {NOTICE_CATEGORIES.find((item) => item.value === classificationHint.category)?.label ?? classificationHint.category}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Confidence: {Math.round(classificationHint.confidence * 100)}%
                  </p>
                  <p className="mt-1 text-muted-foreground">{classificationHint.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notice Content</CardTitle>
              <CardDescription>
                Enter the title and content of your notice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter notice title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as NonNullable<Notice['category']> })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTICE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter notice content"
                  rows={10}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">Quick Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Short summary shown in analytics and delivery previews"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {formData.translations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Multi-language Delivery</CardTitle>
                <CardDescription>
                  Review or edit the generated translations before publishing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.translations.map((translation) => {
                  const languageLabel = LANGUAGE_OPTIONS.find(option => option.value === translation.language)?.label ?? translation.language;
                  return (
                    <div key={translation.language} className="space-y-3 rounded-lg border p-3 sm:p-4">
                      <h3 className="font-medium">{languageLabel}</h3>
                      <div className="grid gap-2">
                        <Label>Translated Title</Label>
                        <Input
                          value={translation.title}
                          onChange={(e) => updateTranslation(translation.language, 'title', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Translated Summary</Label>
                        <Textarea
                          value={translation.summary || ''}
                          onChange={(e) => updateTranslation(translation.language, 'summary', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Translated Content</Label>
                        <Textarea
                          value={translation.content}
                          onChange={(e) => updateTranslation(translation.language, 'content', e.target.value)}
                          rows={6}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Add files to your notice (PDF, images, documents)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOC, XLS, PNG, JPG (max 10MB)
                  </span>
                </label>
              </div>
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{att.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(att.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(att.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Notice['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTICE_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${p.color}`} />
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="requiresAcknowledgement">Require Acknowledgement</Label>
                  <p className="text-sm text-muted-foreground">
                    Students must explicitly confirm they have seen this notice
                  </p>
                </div>
                <Switch
                  id="requiresAcknowledgement"
                  checked={formData.requiresAcknowledgement}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresAcknowledgement: checked })
                  }
                />
              </div>

              {formData.requiresAcknowledgement && (
                <div className="grid gap-2">
                  <Label htmlFor="acknowledgementDeadline">Acknowledgement Deadline</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="acknowledgementDeadline"
                      type="datetime-local"
                      value={formData.acknowledgementDeadline}
                      onChange={(e) => setFormData({ ...formData, acknowledgementDeadline: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Expires At</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="scheduledAt">Schedule For</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="isPublished">Published</Label>
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Channels</CardTitle>
              <CardDescription>
                Choose how published notices should be delivered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>In-App Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Show this notice inside the dashboard notification center
                  </p>
                </div>
                <Switch
                  checked={formData.deliveryChannels.inApp}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      deliveryChannels: { ...formData.deliveryChannels, inApp: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Alert</Label>
                  <p className="text-sm text-muted-foreground">
                    Send this notice by email to users who opted in
                  </p>
                </div>
                <Switch
                  checked={formData.deliveryChannels.email}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      deliveryChannels: { ...formData.deliveryChannels, email: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                Select who should see this notice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="targetType">Target Type</Label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    targetType: value as Notice['targetType'],
                    targetIds: [] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargetTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.targetType !== 'all' && (
                <div className="grid gap-2">
                  <Label>
                    Select {formData.targetType === 'specific_users' ? 'Users' : 
                            formData.targetType.charAt(0).toUpperCase() + formData.targetType.slice(1) + 's'}
                  </Label>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                    {getTargetOptions().map((option) => (
                      <div
                        key={option.id}
                        className={`p-2 rounded cursor-pointer text-sm ${
                          formData.targetIds.includes(option.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleTargetSelect(option.id)}
                      >
                        {option.name}
                      </div>
                    ))}
                  </div>
                  {formData.targetIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.targetIds.map((id) => {
                        const option = getTargetOptions().find(o => o.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {option?.name}
                            <button
                              type="button"
                              onClick={() => handleTargetSelect(id)}
                              className="ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="flex flex-col gap-2">
              <Button type="submit" variant="outline" disabled={isLoading} className="w-full">
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                Publish Now
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
