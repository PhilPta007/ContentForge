import { cn } from '@/lib/utils';
import { Skeleton as SkeletonUI } from '@/components/ui/skeleton';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-5 w-5 animate-spin rounded-full border-2 border-neutral-700 border-t-white',
        className
      )}
    />
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <SkeletonUI className={cn('bg-neutral-800', className)} />;
}
