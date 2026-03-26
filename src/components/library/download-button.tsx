'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GenerationType } from '@/lib/types';

const DOWNLOAD_LABELS: Record<GenerationType, string> = {
  mp3: 'Download MP3',
  video: 'Download Video',
  description: 'Download Text',
  thumbnail: 'Download Image',
  social: 'Copy Posts',
};

interface DownloadButtonProps {
  url: string | null;
  type: GenerationType;
  topic: string;
}

export function DownloadButton({ url, type, topic }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!url) {
    return (
      <Button variant="outline" size="lg" disabled className="gap-2">
        <Download className="h-4 w-4" />
        No file available
      </Button>
    );
  }

  async function handleDownload() {
    if (!url) return;
    setIsDownloading(true);

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const extension = type === 'mp3' ? '.mp3' : type === 'video' ? '.mp4' : type === 'thumbnail' ? '.png' : '.txt';
      const filename = `${topic.slice(0, 50).replace(/[^a-zA-Z0-9\s-]/g, '').trim()}${extension}`;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleDownload}
      disabled={isDownloading}
      className="gap-2 border-[#1e1e1e] hover:border-indigo-600/50"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isDownloading ? 'Downloading...' : DOWNLOAD_LABELS[type]}
    </Button>
  );
}
