"use client";

import Link from "next/link";

/* Global error boundary — shown when a page throws (e.g. Firestore outage) */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <span className="text-white font-bold text-2xl">V</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Something went wrong</h1>
        <p className="text-sm text-[#64748b] mb-8">
          We couldn&apos;t load this page. It&apos;s probably temporary — please try again in a moment.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-200/50"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            Try again
          </button>
          <Link href="/" className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#fafafe] transition-colors">
            Back home
          </Link>
        </div>
        {error.digest && <p className="mt-6 text-[10px] text-[#cbd5e1] font-mono">Error ID: {error.digest}</p>}
      </div>
    </div>
  );
}
