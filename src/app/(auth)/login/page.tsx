import { LoginForm } from '@/components/auth/login-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">Welcome back</h2>
        <p className="text-sm text-neutral-500">Sign in to your account</p>
      </div>
      <LoginForm />
      <OAuthButtons />
    </div>
  );
}
