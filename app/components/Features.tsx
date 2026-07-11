export default function Features() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* ─── Section Heading ───────────────────────────── */}
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eef2ff] border border-[#e0e7ff] mb-5">
            <span className="text-xs font-semibold text-[#6366f1]">
              Infrastructure
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0f172a] tracking-tight mb-5 max-w-3xl mx-auto leading-[1.12]">
            Your living portfolio, powered by{" "}
            <span className="gradient-text">modern infrastructure</span>
          </h2>
          <p className="text-base md:text-lg text-[#64748b] max-w-2xl mx-auto leading-relaxed">
            Real-time sync under the hood, thoughtful design on the surface —
            your portfolio is always alive, updating the moment you save.
          </p>
        </div>

        {/* ─── Feature Cards Grid ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: NoSQL Core */}
          <div className="group relative rounded-3xl border border-[#f1f5f9] bg-white p-8 lg:p-10 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-50 hover:border-[#e0e7ff]">
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#eef2ff] to-transparent opacity-60 -translate-y-8 translate-x-8 pointer-events-none" />

            {/* Icon */}
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-[#6366f1]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-xl font-semibold text-[#0f172a] mb-3">
              A Portfolio Worth Sharing
            </h3>
            <p className="text-sm text-[#64748b] leading-relaxed mb-6">
              Viefolio has one goal: give your work a home that looks like you
              hired a designer. Pick a theme, add your projects, and get a
              polished personal site at your own address — no code, no page
              builders, no fighting with templates.
            </p>

            {/* Detail pills */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f8fafc] text-xs font-medium text-[#475569] border border-[#f1f5f9]">
                <svg
                  className="w-3 h-3 text-[#6366f1]"
                  fill="currentColor"
                  viewBox="0 0 8 8"
                >
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Design-first
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f8fafc] text-xs font-medium text-[#475569] border border-[#f1f5f9]">
                <svg
                  className="w-3 h-3 text-[#6366f1]"
                  fill="currentColor"
                  viewBox="0 0 8 8"
                >
                  <circle cx="4" cy="4" r="3" />
                </svg>
                No code needed
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f8fafc] text-xs font-medium text-[#475569] border border-[#f1f5f9]">
                <svg
                  className="w-3 h-3 text-[#6366f1]"
                  fill="currentColor"
                  viewBox="0 0 8 8"
                >
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Live in minutes
              </span>
            </div>
          </div>

          {/* Card 2: Active Checkpoint Tracking */}
          <div className="group relative rounded-3xl border border-[#f1f5f9] bg-white p-8 lg:p-10 transition-all duration-300 hover:shadow-xl hover:shadow-purple-50 hover:border-[#f3e8ff]">
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#faf5ff] to-transparent opacity-60 -translate-y-8 translate-x-8 pointer-events-none" />

            {/* Icon */}
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-[#8b5cf6]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-xl font-semibold text-[#0f172a] mb-3">
              Active Checkpoint Tracking
            </h3>
            <p className="text-sm text-[#64748b] leading-relaxed mb-6">
              Showcase your <em>process</em>, not just the result. Track
              project stages with live percentages — 15% UI Design, 25%
              Core Functionality — and mark milestones complete as you go.
            </p>

            {/* Mini progress mockup */}
            <div className="space-y-3 rounded-xl bg-[#fafbfc] border border-[#f1f5f9] p-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-[#475569]">
                    UI Design
                  </span>
                  <span className="text-xs font-semibold text-[#8b5cf6]">
                    85%
                  </span>
                </div>
                <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "85%",
                      background:
                        "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-[#475569]">
                    Core Logic
                  </span>
                  <span className="text-xs font-semibold text-[#8b5cf6]">
                    60%
                  </span>
                </div>
                <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "60%",
                      background:
                        "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-[#475569]">
                    Testing
                  </span>
                  <span className="text-xs font-semibold text-[#8b5cf6]">
                    30%
                  </span>
                </div>
                <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "30%",
                      background:
                        "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Real-Time Web Builder */}
          <div className="group relative rounded-3xl border border-[#f1f5f9] bg-white p-8 lg:p-10 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-50 hover:border-[#d1fae5]">
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[#f0fdf4] to-transparent opacity-60 -translate-y-8 translate-x-8 pointer-events-none" />

            {/* Icon */}
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-[#22c55e]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
                />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-xl font-semibold text-[#0f172a] mb-3">
              Real-Time Web Builder
            </h3>
            <p className="text-sm text-[#64748b] leading-relaxed mb-6">
              As you type, edit projects, and update checkpoints in the
              Dashboard, see your generated personal website update live.
              Your <code className="text-[#6366f1] bg-[#eef2ff] px-1 py-0.5 rounded text-xs font-mono">username.viefolio.com</code> is
              always in sync.
            </p>

            {/* Mini preview mockup */}
            <div className="rounded-xl bg-[#fafbfc] border border-[#f1f5f9] overflow-hidden">
              {/* Mini browser bar */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#f1f5f9]">
                <span className="w-2 h-2 rounded-full bg-[#fca5a5]" />
                <span className="w-2 h-2 rounded-full bg-[#fcd34d]" />
                <span className="w-2 h-2 rounded-full bg-[#86efac]" />
                <div className="ml-2 flex-1 flex justify-center">
                  <span className="text-[9px] text-[#94a3b8] font-mono bg-[#f8fafc] px-2 py-0.5 rounded">
                    alex.viefolio.com
                  </span>
                </div>
              </div>

              {/* Mini page content */}
              <div className="p-4 space-y-2.5">
                <div className="h-2.5 w-2/3 bg-[#e2e8f0] rounded" />
                <div className="h-2 w-full bg-[#f1f5f9] rounded" />
                <div className="h-2 w-5/6 bg-[#f1f5f9] rounded" />
                <div className="flex gap-2 mt-3">
                  <div className="h-12 flex-1 rounded-lg bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff]" />
                  <div className="h-12 flex-1 rounded-lg bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
