import Link from 'next/link';
export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        ContentForge
      </h1>
      <p className="mt-4 max-w-lg text-center text-lg text-neutral-400">
        AI-powered content creation for podcasters and YouTube creators
      </p>
      <Link
        href="/signup"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}
