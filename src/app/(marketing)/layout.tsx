import Link from 'next/link';


export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="flex h-14 items-center justify-between border-b border-[#1e1e1e] px-6">
        <Link href="/" className="text-lg font-bold text-white">
          ContentForge
        </Link>
        <Link
          href="/login"
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
