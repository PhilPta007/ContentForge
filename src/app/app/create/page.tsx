'use client';

import { useState } from 'react';
import { TypeSelector } from '@/components/create/type-selector';
import { Mp3Form } from '@/components/create/forms/mp3-form';
import { VideoForm } from '@/components/create/forms/video-form';
import { DescriptionForm } from '@/components/create/forms/description-form';
import { ThumbnailForm } from '@/components/create/forms/thumbnail-form';
import type { GenerationType } from '@/lib/types';

export default function CreatePage() {
  const [selectedType, setSelectedType] = useState<GenerationType | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Create Content</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Choose a content type and configure your generation
        </p>
      </div>

      <TypeSelector value={selectedType} onChange={setSelectedType} />

      {selectedType === 'mp3' && <Mp3Form />}
      {selectedType === 'video' && <VideoForm />}
      {selectedType === 'description' && <DescriptionForm />}
      {selectedType === 'thumbnail' && <ThumbnailForm />}
    </div>
  );
}
