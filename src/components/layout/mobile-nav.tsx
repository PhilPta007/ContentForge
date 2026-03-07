'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Coins,
  ListTodo,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CreditBalance } from '@/components/credits/credit-balance';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Create', href: '/app/create', icon: Sparkles },
  { label: 'Library', href: '/app/library', icon: FolderOpen },
  { label: 'Credits', href: '/app/credits', icon: Coins },
  { label: 'Jobs', href: '/app/jobs', icon: ListTodo },
  { label: 'Settings', href: '/app/settings', icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-60 bg-[#111111] border-r border-[#1e1e1e] p-0">
        <SheetHeader className="flex h-14 items-center px-4 border-b border-[#1e1e1e]">
          <SheetTitle className="text-lg font-bold text-white">ContentForge</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/app'
                ? pathname === '/app'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#1e1e1e] px-3 py-3">
          <CreditBalance />
        </div>
      </SheetContent>
    </Sheet>
  );
}
