import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
      <p className="text-sm font-mono text-indigo-400">404</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-lg border border-[#1e1e1e] px-4 text-sm font-medium text-neutral-300 transition-colors hover:bg-[#111111] hover:text-white"
      >
        Go home
      </Link>
    </div>
  );
}
