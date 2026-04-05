import { LoginForm } from '@/components/auth/login-form';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8" />
          <span className="text-2xl font-bold">NoticeBoard</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Centralized Notice Management System
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Streamline communication across your institution with our powerful 
            notice management platform. Create, target, and track notices 
            efficiently.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold">1000+</div>
              <div className="text-sm text-primary-foreground/70">Active Institutions</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm text-primary-foreground/70">Notices Delivered</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-sm text-primary-foreground/70">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm text-primary-foreground/70">Support</div>
            </div>
          </div>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Trusted by leading educational institutions worldwide
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">NoticeBoard</span>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="#" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
