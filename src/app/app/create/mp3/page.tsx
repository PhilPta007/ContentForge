import { Mp3Form } from '@/components/create/forms/mp3-form';

export default function Mp3Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Generate MP3 Episode</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Create an AI-narrated podcast episode
        </p>
      </div>
      <Mp3Form />
    </div>
  );
}
