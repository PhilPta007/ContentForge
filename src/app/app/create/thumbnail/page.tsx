import { ThumbnailForm } from '@/components/create/forms/thumbnail-form';

export default function ThumbnailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Generate Thumbnails</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Create 3 thumbnail options for your content
        </p>
      </div>
      <ThumbnailForm />
    </div>
  );
}
