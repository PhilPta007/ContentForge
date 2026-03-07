'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { MobileNav } from './mobile-nav';
import { useState } from 'react';

export function AppHeader() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-[#1e1e1e] bg-[#0a0a0a] px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-neutral-400 hover:text-white"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-sm font-medium text-white">Dashboard</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-indigo-600 text-xs text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-[#111111] border-[#1e1e1e]">
            <DropdownMenuItem
              className="text-neutral-300 focus:bg-neutral-800 focus:text-white cursor-pointer"
              onClick={() => router.push('/app/settings')}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-neutral-300 focus:bg-neutral-800 focus:text-white cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </>
  );
}
