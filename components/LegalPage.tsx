/* Shared shell for legal pages (Terms, Privacy) */

import Link from "next/link";

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-[#0f172a] mb-3">{title}</h2>
      <div className="text-sm text-[#475569] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-[#f1f5f9]">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-lg font-semibold text-[#0f172a] tracking-tight">Viefolio</span>
          </Link>
          <a href="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            Get Started
          </a>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight mb-2">{title}</h1>
        <p className="text-sm text-[#94a3b8] mb-10">Last updated: {updated}</p>
        {children}
      </main>

      <footer className="border-t border-[#f1f5f9] py-8 bg-white">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-[#94a3b8]">© {new Date().getFullYear()} Viefolio. All rights reserved.</span>
          <div className="flex items-center gap-6 text-sm text-[#94a3b8]">
            <a href="/privacy" className="hover:text-[#64748b] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#64748b] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
