import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="size-6 animate-spin text-neutral-500" />
    </div>
  );
}
