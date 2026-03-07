import { VideoForm } from '@/components/create/forms/video-form';

export default function VideoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Generate Video</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Create a video with AI voice, images, and optional motion
        </p>
      </div>
      <VideoForm />
    </div>
  );
}
