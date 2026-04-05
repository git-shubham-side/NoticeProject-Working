import { SignupForm } from '@/components/auth/signup-form';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8" />
          <span className="text-2xl font-bold">NoticeBoard</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Join Your Institution Notice Network
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Create a teacher or student account to receive the latest notices,
            reminders, and updates from your institution in one place.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Registration is available for teachers and students
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-xl space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">NoticeBoard</span>
          </div>
          <SignupForm />
          <p className="text-center text-sm text-muted-foreground">
            By signing up, you agree to our{' '}
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
