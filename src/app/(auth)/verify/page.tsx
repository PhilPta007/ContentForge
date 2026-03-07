import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function VerifyPage() {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-indigo-600/10">
        <Mail className="size-7 text-indigo-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Check your email</h2>
        <p className="text-sm text-neutral-400">
          We sent you a verification link. Click it to verify your email address
          and activate your account.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-neutral-500">
          Didn&apos;t receive the email? Check your spam folder or try signing
          up again.
        </p>
        <Link
          href="/login"
          className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
