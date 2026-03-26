import type { Metadata } from 'next';
import { SocialForm } from '@/components/create/forms/social-form';

export const metadata: Metadata = { title: 'Create Social Posts' };

export default function SocialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Social Posts</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Turn any content into platform-optimised social media posts
        </p>
      </div>
      <SocialForm />
    </div>
  );
}
