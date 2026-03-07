export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">ContentForge</h1>
        <p className="text-sm text-neutral-500 mt-1">AI-powered content creation</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
