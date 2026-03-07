'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/examples', label: 'Examples' },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#1e1e1e] bg-[#0a0a0a]/80 px-6 backdrop-blur-md">
      <Link href="/" className="text-lg font-bold text-white">
        ContentForge
      </Link>

      {/* Desktop nav */}
      <nav className="hidden items-center gap-6 md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-neutral-400 transition-colors hover:text-white"
          >
            {link.label}
          </Link>
        ))}
        <div className="h-4 w-px bg-[#1e1e1e]" />
        <Link
          href="/login"
          className="text-sm text-neutral-400 transition-colors hover:text-white"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Get Started
        </Link>
      </nav>

      {/* Mobile hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:text-white md:hidden"
        >
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 border-[#1e1e1e] bg-[#0a0a0a]">
          <SheetHeader>
            <SheetTitle className="text-white">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            {NAV_LINKS.map((link) => (
              <SheetClose key={link.href} render={<span />}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-[#111111] hover:text-white"
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
            <div className="my-2 h-px bg-[#1e1e1e]" />
            <SheetClose render={<span />}>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-[#111111] hover:text-white"
              >
                Sign In
              </Link>
            </SheetClose>
            <SheetClose render={<span />}>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="mt-2 block rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Get Started
              </Link>
            </SheetClose>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
