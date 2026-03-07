'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Generation } from '@/lib/types';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onTimeUpdate() {
      setCurrentTime(audio!.currentTime);
    }
    function onLoadedMetadata() {
      setDuration(audio!.duration);
    }
    function onEnded() {
      setIsPlaying(false);
    }

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const vol = Number(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = vol === 0;
    }
  }

  function toggleMute() {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <div className="relative h-1.5 w-full rounded-full bg-neutral-800">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-indigo-600 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 sm:flex">
          <button onClick={toggleMute} className="text-neutral-400 hover:text-white">
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer accent-indigo-600"
          />
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ url }: { url: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#1e1e1e] bg-[#111111]">
      <video
        src={url}
        controls
        className="aspect-video w-full bg-black"
        controlsList="nodownload"
      />
    </div>
  );
}

function DescriptionViewer({ generation }: { generation: Generation }) {
  const [copied, setCopied] = useState(false);

  const text =
    (generation.output_metadata?.description as string) ||
    generation.output_url ||
    'No description content available.';

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-[#1e1e1e] px-4 py-2">
        <span className="text-xs font-medium text-neutral-400">Generated Description</span>
        <Button variant="ghost" size="xs" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <div className="max-h-96 overflow-y-auto p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
          {text}
        </p>
      </div>
    </div>
  );
}

function ThumbnailViewer({ generation }: { generation: Generation }) {
  const urls: string[] = [];

  if (generation.output_url) {
    urls.push(generation.output_url);
  }

  if (generation.output_metadata?.thumbnails && Array.isArray(generation.output_metadata.thumbnails)) {
    urls.push(...(generation.output_metadata.thumbnails as string[]));
  }

  if (urls.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-[#1e1e1e] bg-[#111111]">
        <p className="text-sm text-neutral-500">No thumbnail images available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {urls.map((url, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-[#1e1e1e] bg-[#111111]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Thumbnail option ${i + 1}`}
            className="aspect-video w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

interface AssetPlayerProps {
  generation: Generation;
}

export function AssetPlayer({ generation }: AssetPlayerProps) {
  switch (generation.type) {
    case 'mp3':
      return generation.output_url ? (
        <AudioPlayer url={generation.output_url} />
      ) : (
        <p className="text-sm text-neutral-500">No audio file available</p>
      );

    case 'video':
      return generation.output_url ? (
        <VideoPlayer url={generation.output_url} />
      ) : (
        <p className="text-sm text-neutral-500">No video file available</p>
      );

    case 'description':
      return <DescriptionViewer generation={generation} />;

    case 'thumbnail':
      return <ThumbnailViewer generation={generation} />;

    default:
      return null;
  }
}
