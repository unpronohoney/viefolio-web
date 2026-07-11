import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <span className="text-white font-bold text-2xl">V</span>
        </div>
        <p className="text-sm font-semibold text-[#6366f1] mb-2">404</p>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Page not found</h1>
        <p className="text-sm text-[#64748b] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-200/50" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            Back home
          </Link>
          <Link href="/login" className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#fafafe] transition-colors">
            Create a portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
