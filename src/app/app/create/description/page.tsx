import { DescriptionForm } from '@/components/create/forms/description-form';

export default function DescriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Generate Description</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Create an SEO-optimised description with your brand voice
        </p>
      </div>
      <DescriptionForm />
    </div>
  );
}
