import { SignupForm } from '@/components/auth/signup-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">Create your account</h2>
        <p className="text-sm text-neutral-500">Start creating content with AI</p>
      </div>
      <SignupForm />
      <OAuthButtons />
    </div>
  );
}
