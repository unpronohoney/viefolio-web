/* Skeleton shown while the portfolio's Firestore data loads */
export default function PortfolioLoading() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 border-b border-[#f1f5f9] bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f1f5f9] animate-pulse" />
            <div className="h-4 w-28 rounded bg-[#f1f5f9] animate-pulse" />
          </div>
          <div className="h-3 w-24 rounded bg-[#f1f5f9] animate-pulse" />
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 pt-12">
        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-2xl bg-[#f1f5f9] animate-pulse shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-6 w-48 rounded bg-[#f1f5f9] animate-pulse" />
            <div className="h-4 w-32 rounded bg-[#f8fafc] animate-pulse" />
            <div className="h-3 w-64 max-w-full rounded bg-[#f8fafc] animate-pulse" />
          </div>
        </div>
        {/* Social pills */}
        <div className="flex gap-2 mb-12">
          {[0, 1, 2].map(i => <div key={i} className="w-9 h-9 rounded-full bg-[#f1f5f9] animate-pulse" />)}
        </div>
        {/* Project cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-16">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-[#f1f5f9] p-5 space-y-3">
              <div className="h-32 rounded-xl bg-[#f8fafc] animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-[#f1f5f9] animate-pulse" />
              <div className="h-3 w-full rounded bg-[#f8fafc] animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 w-14 rounded bg-[#f8fafc] animate-pulse" />
                <div className="h-5 w-14 rounded bg-[#f8fafc] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
