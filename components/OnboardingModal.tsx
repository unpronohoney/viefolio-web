"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/db";
import type { AccountType } from "@/types/portfolio";
import { THEME_PRESETS } from "@/types/portfolio";

/* ─── Card Data ──────────────────────────────────────── */
const ACCOUNT_OPTIONS: {
  type: AccountType;
  title: string;
  desc: string;
  iconPath: string;
  gradient: string;
}[] = [
  {
    type: "DEVELOPER",
    title: "Developer",
    desc: "Build & showcase dev projects",
    iconPath: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    type: "DESIGNER",
    title: "Designer",
    desc: "Present your creative portfolio",
    iconPath:
      "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42",
    gradient: "from-purple-500 to-pink-400",
  },
  {
    type: "CREATOR",
    title: "Creator",
    desc: "Share your links & content",
    iconPath:
      "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    type: "STUDENT",
    title: "Student",
    desc: "Highlight your academic work",
    iconPath:
      "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
    gradient: "from-emerald-500 to-teal-400",
  },
];

/* ─── Smart Defaults per Account Type ───────────────── */
// Write a complete theme — partial themes leave undefined fields in dashboard
// state, and Firestore rejects writes containing undefined.
const THEME_EXTRAS = { fontFamily: "SANS", cardStyle: "FLAT", buttonStyle: "ROUNDED" } as const;

function getSmartDefaults(type: AccountType) {
  switch (type) {
    case "CREATOR":
      return { layoutStyle: "CAROUSEL" as const, socialLinksLayout: "CREATOR" as const, theme: { preset: "NEON" as const, ...THEME_PRESETS.NEON, ...THEME_EXTRAS } };
    case "DESIGNER":
      return { theme: { preset: "GLASSMORPHISM" as const, ...THEME_PRESETS.GLASSMORPHISM, ...THEME_EXTRAS } };
    case "STUDENT":
      return { theme: { preset: "MINIMAL" as const, ...THEME_PRESETS.MINIMAL, ...THEME_EXTRAS } };
    default:
      return { theme: { preset: "MINIMAL" as const, ...THEME_PRESETS.MINIMAL, ...THEME_EXTRAS } };
  }
}

/* ═══════════════════════════════════════════════════════
   OnboardingModal
   ═══════════════════════════════════════════════════════ */
export default function OnboardingModal({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState<AccountType | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!selected) return;
    setSaving(true);
    try {
      const defaults = getSmartDefaults(selected);
      await setDoc(
        doc(db, "profiles", userId),
        { accountType: selected, ...defaults },
        { merge: true }
      );
      onComplete();
    } catch (err) {
      console.error("Onboarding save error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl px-6"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Viefolio
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            How do you plan to use Viefolio?
          </h1>
          <p className="text-base text-[#94a3b8] max-w-lg mx-auto">
            Pick what fits you best. We&apos;ll set up smart defaults — you can change everything later.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {ACCOUNT_OPTIONS.map((opt, i) => {
            const isActive = selected === opt.type;
            return (
              <motion.button
                key={opt.type}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
                onClick={() => setSelected(opt.type)}
                className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 text-center group ${
                  isActive
                    ? "border-white/40 bg-white/10 shadow-2xl shadow-white/5 scale-[1.03]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20"
                }`}
              >
                {/* Glow effect */}
                {isActive && (
                  <motion.div
                    layoutId="onboarding-glow"
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${opt.gradient} opacity-[0.12]`}
                    transition={{ duration: 0.3 }}
                  />
                )}
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${opt.gradient} shadow-lg`
                      : "bg-white/10"
                  }`}
                >
                  <svg
                    className={`w-7 h-7 transition-colors ${isActive ? "text-white" : "text-white/60"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={opt.iconPath}
                    />
                  </svg>
                </div>
                {/* Text */}
                <div className="relative z-10">
                  <h3
                    className={`text-base font-bold transition-colors ${
                      isActive ? "text-white" : "text-white/80"
                    }`}
                  >
                    {opt.title}
                  </h3>
                  <p
                    className={`text-xs mt-1 transition-colors ${
                      isActive ? "text-white/70" : "text-white/40"
                    }`}
                  >
                    {opt.desc}
                  </p>
                </div>
                {/* Checkmark */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-[#0f172a]"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="flex justify-center">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: selected ? 1 : 0.4 }}
            whileHover={selected ? { scale: 1.03, boxShadow: "0 16px 40px rgba(99,102,241,0.4)" } : {}}
            whileTap={selected ? { scale: 0.97 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={handleConfirm}
            disabled={!selected || saving}
            className="px-10 py-3.5 rounded-2xl text-base font-bold text-white transition-colors disabled:cursor-not-allowed"
            style={{
              background: selected
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.1)",
            }}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Setting up…
              </span>
            ) : (
              "Continue →"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
