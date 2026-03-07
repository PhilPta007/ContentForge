import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-800/50">
        <Icon className="h-7 w-7 text-neutral-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-neutral-400">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
