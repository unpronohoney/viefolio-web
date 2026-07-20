"use client";

import { useState, useEffect } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import type { Profile, Project, Checkpoint, TechStack, ProjectLink, Skill, Theme, SocialLink, SocialLinksLayout, ThemeFont, CardStyle, ButtonStyle } from "@/types/portfolio";
import { DEFAULT_THEME } from "@/types/portfolio";

/* ─── Theme Helpers ──────────────────────────────────── */
export function getThemeStyles(theme: Theme) {
  const t = theme ?? DEFAULT_THEME;
  const preset = t.preset;
  const c = t.colors;
  const isDark = preset === 'NEON' || preset === 'GLASSMORPHISM';

  const base = {
    '--bg': c.background,
    '--card-bg': c.card,
    '--accent': c.accent,
    '--text': c.text,
    '--text-secondary': isDark ? 'rgba(255,255,255,0.55)' : '#64748b',
    '--border': isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    '--border-light': isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
    '--surface': isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    '--theme-bg': c.background,
    '--theme-text': c.text,
    '--theme-accent': c.accent,
    '--theme-description': c.descriptionColor ?? '#64748b',
    '--theme-card': c.card,
  } as Record<string, string>;

  let cardStyle: React.CSSProperties = { backgroundColor: c.card, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' };
  const wrapperBg: React.CSSProperties = { backgroundColor: c.background, color: c.text };

  if (preset === 'NEON') {
    cardStyle = { ...cardStyle, boxShadow: `0 0 20px ${c.accent}18, 0 0 60px ${c.accent}08` };
  } else if (preset === 'GLASSMORPHISM') {
    cardStyle = { ...cardStyle, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.12)' };
  } else if (preset === 'BRUTALIST') {
    cardStyle = { ...cardStyle, borderRadius: '4px', borderColor: '#000', borderWidth: '2px', boxShadow: '4px 4px 0 #000' };
  }

  return { vars: base, cardStyle, wrapperBg, isDark, preset };
}

export function getFontStyle(fontFamily?: ThemeFont): React.CSSProperties {
  switch (fontFamily) {
    case 'SERIF': return { fontFamily: "Georgia, 'Times New Roman', serif" };
    case 'MONO': return { fontFamily: "'ui-monospace', 'SFMono-Regular', 'Menlo', monospace" };
    case 'DISPLAY': return { fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif" };
    default: return {};
  }
}

export function getCardOverride(cardStyle?: CardStyle): React.CSSProperties {
  switch (cardStyle) {
    case 'GLASSMORPHIC': return { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.18)' };
    case 'SOFT_SHADOW': return { boxShadow: '0 4px 24px rgba(0,0,0,0.07)', borderColor: 'transparent' };
    case 'BRUTALIST': return { borderRadius: '4px', borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--theme-text)', boxShadow: '4px 4px 0 var(--theme-accent)' };
    case 'FLAT': return { boxShadow: 'none' };
    default: return {};
  }
}

export function getLinkCardOverride(cardStyle?: CardStyle): React.CSSProperties {
  switch (cardStyle) {
    case 'GLASSMORPHIC': return { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.18)' };
    case 'SOFT_SHADOW': return { boxShadow: '0 4px 24px rgba(0,0,0,0.07)' };
    case 'BRUTALIST': return { boxShadow: '3px 3px 0 var(--theme-accent)' };
    case 'FLAT': return { boxShadow: 'none' };
    default: return {};
  }
}

export function getButtonRadius(buttonStyle?: ButtonStyle): string {
  switch (buttonStyle) {
    case 'PILL': return 'rounded-full';
    case 'SHARP': return 'rounded';
    case 'GHOST': return 'rounded-xl';
    default: return 'rounded-xl';
  }
}

export function getButtonOverride(buttonStyle?: ButtonStyle, color?: string): React.CSSProperties {
  if (buttonStyle === 'GHOST') return { backgroundColor: 'transparent', borderColor: color ?? '#6366f1', borderWidth: '1.5px', borderStyle: 'solid' };
  if (buttonStyle === 'SHARP') return { borderRadius: '4px' };
  return {};
}

function textureCSS(texture: string, accent: string): React.CSSProperties {
  if (texture === 'DOTS') return { backgroundImage: `radial-gradient(${accent}38 1.5px, transparent 1.5px)`, backgroundSize: '18px 18px' };
  if (texture === 'GRID') return { backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`, backgroundSize: '32px 32px' };
  if (texture === 'NOISE') return { backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.10'/%3E%3C/svg%3E")` };
  return {};
}

/* ─── Helpers ────────────────────────────────────────── */
export function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!url) return null;
  return (
    // Own LazyMotion wrapper — the dashboard renders this standalone
    <LazyMotion features={domAnimation}>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8" onClick={onClose}>
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <m.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        transition={{ duration: 0.3, ease: "easeOut" }} 
        className="relative z-10 w-full max-w-6xl h-full flex flex-col justify-center items-center" 
        onClick={e => e.stopPropagation()}
      >
        <img src={url} alt="Fullscreen projection" className="w-full h-full object-contain rounded-xl shadow-2xl" />
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur flex items-center justify-center text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </m.div>
    </div>
    </LazyMotion>
  );
}
export function ensureHttps(url: string) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function formatDateSpan(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return "";
  const fmt = (d: string) => {
    if (!d || d === "present") return "Present";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  if (!startDate) return fmt(endDate);
  if (!endDate || endDate === "present") return `${fmt(startDate)} — Present`;
  return `${fmt(startDate)} — ${fmt(endDate)}`;
}

export function SocialIcon({ type, url, color }: { type: string; url: string; color: string }) {
  if (!url) return null;
  return (
    <a href={ensureHttps(url)} target="_blank" rel="noopener noreferrer"
      className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:scale-105"
      style={{ borderColor: `${color}30`, color, backgroundColor: `${color}10` }}>
      {type === "github" && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>}
      {type === "linkedin" && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>}
      {type === "twitter" && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
    </a>
  );
}

export function calcProgress(cps: Checkpoint[]): number {
  if (!cps.length) return 0;
  return Math.round(cps.filter(c => c.isCompleted).reduce((s, c) => s + c.percentage, 0));
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  SOLO: "Solo", TEAM: "Team", INTERNSHIP: "Internship", ACADEMIC: "Academic",
  FREELANCE: "Freelance", CLIENT: "Client", PERSONAL: "Personal",
  OPEN_SOURCE: "Open Source", COMMISSION: "Commission",
};

/* ─── Icon Paths ─────────────────────────────────────── */
const ICON_PATHS: Record<string, string> = {
  Code: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  Mobile: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3",
  Globe: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
  Database: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125",
  Palette: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42",
  Camera: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z",
  PenTool: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  Video: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
  Mic: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z",
  Sparkles: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
};

/* ─── Link Icon Component ────────────────────────────── */
export function LinkIcon({ type, size = 4 }: { type: string; size?: number }) {
  const t = type.toUpperCase();
  const cls = `w-${size} h-${size}`;
  if (t === "GITHUB") return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>;
  if (t.includes("PLAY") || t.includes("SMARTPHONE")) return <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"/></svg>;
  if (t.includes("APP_STORE") || t.includes("APPSTORE")) return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>;
  if (t.includes("LINKEDIN")) return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  return <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>;
}

export function linkLabel(type: string): string {
  const t = type.toUpperCase();
  if (t === "GITHUB") return "GitHub";
  if (t.includes("PLAY")) return "Play Store";
  if (t.includes("APP_STORE") || t.includes("APPSTORE")) return "App Store";
  if (t.includes("LINKEDIN")) return "LinkedIn";
  if (t === "TWITTER") return "Twitter";
  if (t === "X") return "X";
  if (t === "YOUTUBE") return "YouTube";
  if (t === "INSTAGRAM") return "Instagram";
  if (t === "TIKTOK") return "TikTok";
  if (t === "FIGMA") return "Figma";
  if (t === "BEHANCE") return "Behance";
  if (t === "DRIBBBLE") return "Dribbble";
  if (t.includes("WEBSITE")) return "Website";
  return "Link";
}

/* ─── Badges Row ─────────────────────────────────────── */
function BadgesRow({ p, color }: { p: Project; color: string }) {
  const dateLabel = formatDateSpan(p.startDate, p.endDate);
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      {p.projectType && p.projectType !== "SOLO" && (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ color, backgroundColor: `${color}10` }}>
          {PROJECT_TYPE_LABELS[p.projectType] || p.projectType}
        </span>
      )}
      {dateLabel && (
        <span className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[10px] font-medium text-[#64748b]">
          {dateLabel}
        </span>
      )}
    </div>
  );
}

/* ─── Social Link SVGs ───────────────────────────────── */
function SocialLinkSvg({ type, size = 4 }: { type: string; size?: number }) {
  const cls = `w-${size} h-${size}`;
  const t = type.toUpperCase();
  if (t === 'GITHUB') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>;
  if (t === 'LINKEDIN') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  if (t === 'TWITTER' || t === 'X') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (t === 'YOUTUBE') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  if (t === 'INSTAGRAM') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
  if (t === 'FIGMA') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.02 0-1.664-1.354-3.018-3.019-3.018h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019 0 1.664 1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.354-3.019 3.019s1.354 3.019 3.019 3.019h3.117V8.981H8.148zm4.587 8.981a4.49 4.49 0 014.49 4.49 4.49 4.49 0 01-4.49 4.49 4.49 4.49 0 01-4.49-4.49 4.49 4.49 0 014.49-4.49zm0 1.471c-1.665 0-3.019 1.354-3.019 3.019 0 1.664 1.354 3.019 3.019 3.019 1.664 0 3.019-1.355 3.019-3.019 0-1.665-1.355-3.019-3.019-3.019z"/></svg>;
  if (t === 'BEHANCE') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-.17 1.35-.5.35-1.07.6-1.72.76-.65.16-1.33.25-2.05.25H0V4.51h6.938v-.007zM16.94 16.665c.44.428 1.073.643 1.894.643.59 0 1.1-.148 1.53-.447.424-.29.68-.61.78-.94h2.588c-.403 1.28-1.048 2.2-1.9 2.75-.85.56-1.884.83-3.08.83-.837 0-1.584-.13-2.272-.4-.673-.27-1.24-.65-1.72-1.14-.464-.49-.82-1.08-1.07-1.77-.254-.69-.38-1.45-.38-2.27 0-.803.13-1.54.39-2.23.26-.69.62-1.29 1.09-1.79.466-.49 1.033-.88 1.7-1.16.668-.28 1.4-.42 2.218-.42.896 0 1.67.163 2.347.5.675.332 1.23.788 1.66 1.37.44.583.75 1.256.94 2.02.19.76.25 1.57.21 2.41h-7.69c0 .84.218 1.472.66 1.9zM16.07 11.656c-.354.37-.553.88-.553 1.5h4.826c-.06-.67-.265-1.18-.62-1.55-.357-.37-.857-.556-1.5-.556-.67 0-1.2.204-1.552.607zM15.553 4.54h5.04v1.73h-5.04V4.54zM4.847 7.27H2.428v2.6h2.29c.352 0 .68-.03.97-.1.295-.07.54-.19.732-.34.19-.154.346-.35.44-.59.097-.24.145-.52.145-.86 0-.73-.185-1.2-.565-1.43-.38-.22-.93-.33-1.593-.28zm.137 4.914H2.428v3.02h2.54c.422 0 .8-.04 1.13-.12.33-.08.61-.22.83-.39.23-.18.4-.41.52-.69.12-.28.18-.62.18-1.01 0-.78-.22-1.35-.69-1.7-.46-.34-1.08-.52-1.83-.52l-.33.41z"/></svg>;
  if (t === 'DRIBBBLE') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.048 6.36 1.73 1.35 3.92 2.16 6.303 2.16 1.42 0 2.77-.29 4-.77zm-11.62-2.58c.232-.386 3.045-5.129 8.332-6.946.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.032 2.634 6.838zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.477 0-.945.04-1.4.11zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.316-6.386z"/></svg>;
  if (t === 'TIKTOK') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>;
  if (t === 'WEBSITE') return <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>;
  return <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>;
}

/* ─── UserInfoSection ────────────────────────────────── */
export function UserInfoSection({ profile, color, ts }: { profile: Profile; color: string; ts: ReturnType<typeof getThemeStyles> }) {
  const layout = profile.userInfoLayout || 'LEFT';
  const hasAvatar = profile.showAvatar && profile.avatarUrl;
  const avatar = hasAvatar ? (
    <img src={profile.avatarUrl} alt={profile.fullName} width={80} height={80} fetchPriority="high" decoding="async" className="w-20 h-20 rounded-2xl object-cover shadow-xl shrink-0" style={{ boxShadow: `0 8px 30px ${color}20` }}/>
  ) : profile.showAvatar ? (
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shrink-0" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 30px ${color}20` }}>
      {(profile.fullName || profile.username || 'U').charAt(0).toUpperCase()}
    </div>
  ) : null;

  const textBlock = (align: string = 'text-left') => (
    <div className={`flex-1 min-w-0 ${align}`}>
      {profile.fullName && <h1 className="text-3xl font-bold tracking-tight" style={{ color: ts.vars['--text'] }}>{profile.fullName}</h1>}
      {profile.title && <p className="text-base mt-1 font-medium" style={{ color: ts.vars['--text-secondary'] }}>{profile.title}</p>}
      {profile.location && (
        <div className={`flex items-center gap-1.5 mt-2 ${align === 'text-center' ? 'justify-center' : align === 'text-right' ? 'justify-end' : ''}`}>
          <svg className="w-3.5 h-3.5" style={{ color: ts.vars['--text-secondary'] }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
          <span className="text-sm" style={{ color: ts.vars['--text-secondary'] }}>{profile.location}</span>
        </div>
      )}
      {profile.bio && <p className="text-sm mt-4 leading-relaxed max-w-2xl" style={{ color: ts.vars['--text-secondary'] }}>{profile.bio}</p>}
    </div>
  );

  if (layout === 'CENTER') {
    return (
      <section className="pt-16 pb-8 px-6">
        <div className="flex flex-col items-center text-center">
          {avatar && <div className="mb-4">{avatar}</div>}
          {textBlock('text-center')}
        </div>
      </section>
    );
  }
  if (layout === 'RIGHT') {
    return (
      <section className="pt-16 pb-8 px-6">
        <div className="flex flex-col sm:flex-row-reverse items-start gap-6">{avatar}{textBlock('text-right')}</div>
      </section>
    );
  }
  // LEFT (default)
  return (
    <section className="pt-16 pb-8 px-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">{avatar}{textBlock()}</div>
    </section>
  );
}

/* ─── SocialLinksSection ─────────────────────────────── */
export function SocialLinksSection({ links, layout, color, ts, buttonStyle, cardStyle }: { links: SocialLink[]; layout: SocialLinksLayout; color: string; ts: ReturnType<typeof getThemeStyles>; buttonStyle?: ButtonStyle; cardStyle?: CardStyle }) {
  const visibleLinks = links.filter(l => l.visible !== false && l.url);
  if (visibleLinks.length === 0) return null;

  const btnRadius = getButtonRadius(buttonStyle);
  const btnOverride = getButtonOverride(buttonStyle, color);
  const linkCardOverride = getLinkCardOverride(cardStyle);

  if (layout === 'ICONS') {
    return (
      <section className="px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {visibleLinks.map(l => (
            <a key={l.id} href={ensureHttps(l.url)} target="_blank" rel="noopener noreferrer"
              className={`w-10 h-10 ${btnRadius} border flex items-center justify-center transition-all hover:scale-110`}
              style={{ borderColor: `${color}30`, color, backgroundColor: 'var(--theme-card)', ...linkCardOverride, ...btnOverride }} title={l.title || l.type}>
              <SocialLinkSvg type={l.type} size={4}/>
            </a>
          ))}
        </div>
      </section>
    );
  }

  if (layout === 'CARD') {
    return (
      <section className="px-6 pb-6">
        <div className="flex flex-wrap gap-3">
          {visibleLinks.map(l => (
            <a key={l.id} href={ensureHttps(l.url)} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-3 px-4 py-3 ${btnRadius} border transition-all hover:shadow-md hover:scale-[1.02]`}
              style={{ borderColor: `${color}20`, backgroundColor: 'var(--theme-card)', color: ts.vars['--text'], ...linkCardOverride, ...btnOverride }}>
              {l.imageUrl ? (
                <img src={l.imageUrl} alt={l.title} loading="lazy" decoding="async" className="w-8 h-8 rounded-lg object-cover shrink-0"/>
              ) : (
                <div className={`w-8 h-8 ${btnRadius} flex items-center justify-center shrink-0`} style={{ backgroundColor: `${color}15`, color }}>
                  <SocialLinkSvg type={l.type} size={4}/>
                </div>
              )}
              <span className="text-sm font-semibold">{l.title || l.type}</span>
            </a>
          ))}
        </div>
      </section>
    );
  }

  // CREATOR layout — full-width vertical pill buttons
  const creatorRadius = buttonStyle === 'SHARP' ? 'rounded' : buttonStyle === 'ROUNDED' ? 'rounded-2xl' : 'rounded-full';
  return (
    <section className="px-6 pb-6">
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {visibleLinks.map(l => (
          <m.a key={l.id} href={ensureHttps(l.url)} target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className={`w-full flex items-center gap-4 px-5 py-4 ${creatorRadius} border transition-all duration-300 hover:scale-[1.015] hover:shadow-lg group`}
            style={{ backgroundColor: buttonStyle === 'GHOST' ? 'transparent' : 'var(--theme-card)', borderColor: `${color}30`, color: ts.vars['--text'], ...linkCardOverride }}>
            {l.imageUrl ? (
              <img src={l.imageUrl} alt={l.title} loading="lazy" decoding="async" className="w-10 h-10 rounded-full object-cover shrink-0 border-2" style={{ borderColor: `${color}30` }}/>
            ) : null}
            <div className={`flex-1 ${l.imageUrl ? '' : 'text-center'} min-w-0`}>
              <span className="text-sm font-semibold block truncate">{l.title}</span>
              <span className="text-[10px] block truncate" style={{ color: ts.vars['--text-secondary'] }}>{l.url.replace(/^https?:\/\//, '')}</span>
            </div>
          </m.a>
        ))}
      </div>
    </section>
  );
}

/* ─── Skills Section ─────────────────────────────────── */
function SkillsSection({ skills, color, ts, cardStyle }: { skills: Skill[]; color: string; ts: ReturnType<typeof getThemeStyles>; cardStyle?: CardStyle }) {
  const visible = (skills || []).filter(s => s.visible !== false);
  if (visible.length === 0) return null;
  const skillOverride = getCardOverride(cardStyle);
  return (
    <section className="px-6 pb-8">
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
        <h2 className="text-lg font-semibold" style={{ color: ts.vars['--text'] }}>Skills</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visible.map((s, i) => (
          <div key={i} className="rounded-xl p-3 border transition-shadow hover:shadow-sm" style={{ backgroundColor: 'var(--theme-card)', borderColor: ts.vars['--border-light'], ...skillOverride }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: ts.vars['--text'] }}>{s.name}</span>
              <span className="text-[10px] font-medium" style={{ color: ts.vars['--text-secondary'] }}>{s.level}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: ts.vars['--border-light'] }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.level}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}/>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Project Card (CLASSIC) ────────────────────────── */
function ProjectCard({ p, color, onClick, onImageClick, className = "", cardStyle }: { p: Project; color: string; onClick: () => void; onImageClick?: (url: string) => void; className?: string; cardStyle?: CardStyle }) {
  const isReleased = p.status === "RELEASED" || p.status === "COMPLETED";
  const prog = calcProgress(p.checkpoints);
  const iconPath = ICON_PATHS[p.icon] ?? ICON_PATHS.Code;
  return (
    <button onClick={onClick} className={`rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg hover:shadow-black/[0.03] transition-all duration-300 hover:-translate-y-0.5 text-left w-full group ${className}`} style={{ backgroundColor: 'var(--theme-card)', ...getCardOverride(cardStyle) }}>
      {p.showImage && p.imageUrl ? (
        <div className="w-full h-40 overflow-hidden relative flex items-center justify-center" onClick={e => { if (onImageClick) { e.stopPropagation(); onImageClick(p.imageUrl); }}}>
          <img src={p.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-50" />
          <img src={p.imageUrl} alt={p.title} loading="lazy" decoding="async" className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"/>
          {onImageClick && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg></div>}
        </div>
      ) : (
        <div className="w-full h-32 flex items-center justify-center" style={{ backgroundColor: `${color}08` }}>
          <svg className="w-10 h-10" style={{ color: `${color}60` }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/></svg>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1.5">
          <h3 className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>{p.title}</h3>
          {isReleased ? (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ml-3" style={{ color, backgroundColor: `${color}10`, borderColor: `${color}25` }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Completed
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ml-3" style={{ color, backgroundColor: `${color}10`, borderColor: `${color}25` }}>{prog}%</span>
          )}
        </div>
        <BadgesRow p={p} color={color} />
        {p.description && <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--theme-description)' }}>{p.description}</p>}
        {!isReleased && p.checkpoints.length > 0 && (
          <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full mb-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${prog}%`, background: prog === 100 ? "#22c55e" : color }}/>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">{p.techStack.filter(t => t.technologyName).slice(0, 4).map((t: TechStack, i: number) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[10px] font-medium text-[#475569]">{t.technologyName}</span>
          ))}</div>
          <div className="flex gap-1.5">{p.links.filter(l => l.url && l.url !== "#").slice(0, 3).map((l: ProjectLink, i: number) => (
            <span key={i} style={{ color }}><LinkIcon type={l.type}/></span>
          ))}</div>
        </div>
      </div>
    </button>
  );
}

/* ─── Minimal Card ───────────────────────────────────── */
function MinimalCard({ p, color, onClick, onImageClick, cardStyle }: { p: Project; color: string; onClick: () => void; onImageClick?: (url: string) => void; cardStyle?: CardStyle }) {
  const isReleased = p.status === "RELEASED" || p.status === "COMPLETED";
  const prog = calcProgress(p.checkpoints);
  const iconPath = ICON_PATHS[p.icon] ?? ICON_PATHS.Code;
  return (
    <button onClick={onClick} className="w-full text-left border border-[#e2e8f0] rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group mb-3" style={{ backgroundColor: 'var(--theme-card)', ...getCardOverride(cardStyle) }}>
      <div className="flex items-start gap-4">
        {p.showImage && p.imageUrl ? (
          <div className="relative w-24 h-24 min-w-[96px] rounded-lg overflow-hidden" onClick={e => { if (onImageClick) { e.stopPropagation(); onImageClick(p.imageUrl); }}}>
            <img src={p.imageUrl} alt={p.title} loading="lazy" decoding="async" className="w-full h-full object-cover"/>
            {onImageClick && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg></div>}
          </div>
        ) : (
          <div className="w-24 h-24 min-w-[96px] rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}08` }}>
            <svg className="w-8 h-8" style={{ color: `${color}50` }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/></svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-base font-semibold group-hover:opacity-80 transition-opacity truncate" style={{ color: 'var(--theme-text)' }}>{p.title}</h3>
            {isReleased ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ml-3" style={{ color, backgroundColor: `${color}10` }}>Completed</span>
            ) : (
              <span className="text-xs font-semibold shrink-0 ml-3" style={{ color }}>{prog}%</span>
            )}
          </div>
          <BadgesRow p={p} color={color} />
          {p.description && <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--theme-description)' }}>{p.description}</p>}
          <div className="flex items-center gap-2">
            {p.techStack.filter(t => t.technologyName).slice(0, 5).map((t: TechStack, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[10px] font-medium text-[#475569]">{t.technologyName}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Carousel Card ──────────────────────────────────── */
function CarouselCard({ p, color, onClick, onImageClick, cardStyle }: { p: Project; color: string; onClick: () => void; onImageClick?: (url: string) => void; cardStyle?: CardStyle }) {
  const isReleased = p.status === "RELEASED" || p.status === "COMPLETED";
  const prog = calcProgress(p.checkpoints);
  const iconPath = ICON_PATHS[p.icon] ?? ICON_PATHS.Code;
  return (
    <button onClick={onClick} className="min-w-[320px] max-w-[350px] h-[550px] flex flex-col border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden snap-center text-left shrink-0 hover:shadow-lg transition-all duration-300 group" style={{ backgroundColor: 'var(--theme-card)', ...getCardOverride(cardStyle) }}>
      {p.showImage && p.imageUrl ? (
        <div className="w-full h-44 overflow-hidden shrink-0 relative flex items-center justify-center" onClick={e => { if (onImageClick) { e.stopPropagation(); onImageClick(p.imageUrl); }}}>
          <img src={p.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-50" />
          <img src={p.imageUrl} alt={p.title} loading="lazy" decoding="async" className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"/>
          {onImageClick && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg></div>}
        </div>
      ) : (
        <div className="w-full h-36 flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}08` }}>
          <svg className="w-10 h-10" style={{ color: `${color}50` }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/></svg>
        </div>
      )}
      <div className="p-4 shrink-0">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-base font-semibold truncate" style={{ color: 'var(--theme-text)' }}>{p.title}</h3>
          {isReleased ? (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ml-2" style={{ color, backgroundColor: `${color}10` }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Done
            </span>
          ) : (
            <span className="text-xs font-semibold shrink-0 ml-2" style={{ color }}>{prog}%</span>
          )}
        </div>
        <BadgesRow p={p} color={color} />
        {p.description && <p className="text-xs line-clamp-2" style={{ color: 'var(--theme-description)' }}>{p.description}</p>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 border-t border-[#f1f5f9]">
        {!isReleased && p.checkpoints.length > 0 && (
          <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full mb-3 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${prog}%`, background: prog === 100 ? "#22c55e" : color }}/>
          </div>
        )}
        {p.checkpoints.length > 0 ? (
          <div className="space-y-2">
            {p.checkpoints.map((cp: Checkpoint, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cp.isCompleted ? "#22c55e" : "#d1d5db" }}/>
                <span className={`text-xs flex-1 ${cp.isCompleted ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>{cp.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {p.techStack.filter(t => t.technologyName).slice(0, 6).map((t: TechStack, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[10px] font-medium text-[#475569]">{t.technologyName}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

/* ─── Timeline Node ──────────────────────────────────── */
function TimelineNode({ p, color, onClick, index, cardStyle }: { p: Project; color: string; onClick: () => void; index: number; cardStyle?: CardStyle }) {
  const isReleased = p.status === "RELEASED" || p.status === "COMPLETED";
  const prog = calcProgress(p.checkpoints);
  const dateLabel = formatDateSpan(p.startDate, p.endDate);
  const iconPath = ICON_PATHS[p.icon] ?? ICON_PATHS.Code;

  return (
    <m.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className="relative pl-10 md:pl-14 pb-10 last:pb-0 group"
    >
      {/* Vertical line segment */}
      <div className="absolute left-[15px] md:left-[23px] top-0 bottom-0 w-[2px]" style={{ backgroundColor: `${color}20` }}/>
      {/* Node: avatar if image exists, dot otherwise */}
      {p.imageUrl ? (
        <img src={p.imageUrl} alt={p.title} loading="lazy" decoding="async" className="absolute left-[4px] md:left-[12px] top-0 w-8 h-8 rounded-full object-cover border-2 shadow-sm z-10 transition-all group-hover:scale-110" style={{ borderColor: color }}/>
      ) : (
        <div className="absolute left-[8px] md:left-[16px] top-1 w-4 h-4 rounded-full border-[3px] bg-white shadow-sm z-10 transition-all group-hover:scale-125" style={{ borderColor: color }}/>
      )}

      {/* Card */}
      <button onClick={onClick} className="w-full text-left rounded-xl border border-[#f1f5f9] p-5 hover:shadow-lg hover:shadow-black/[0.03] transition-all duration-300 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--theme-card)', ...getCardOverride(cardStyle) }}>
        {/* Date */}
        {dateLabel && (
          <span className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color }}>{dateLabel}</span>
        )}
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10` }}>
              <svg className="w-4.5 h-4.5" style={{ color }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/></svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate" style={{ color: 'var(--theme-text)' }}>{p.title}</h3>
              {p.description && <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--theme-description)' }}>{p.description}</p>}
            </div>
          </div>
          {/* Status badge */}
          {isReleased ? (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ml-3" style={{ color: "#22c55e", backgroundColor: "#f0fdf4" }}>✓ Completed</span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ml-3" style={{ color, backgroundColor: `${color}10` }}>{prog}%</span>
          )}
        </div>
        {/* Badges + Tech */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {p.projectType && p.projectType !== "SOLO" && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ color, backgroundColor: `${color}08` }}>{PROJECT_TYPE_LABELS[p.projectType]}</span>
          )}
          {p.techStack.filter(t => t.technologyName).slice(0, 4).map((t: TechStack, i: number) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[10px] font-medium text-[#475569]">{t.technologyName}</span>
          ))}
        </div>
        {/* Progress bar */}
        {!isReleased && p.checkpoints.length > 0 && (
          <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full mt-3 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${prog}%`, background: color }}/>
          </div>
        )}
      </button>
    </m.div>
  );
}

/* ─── Project Detail Modal ───────────────────────────── */
function DetailModal({ p, color, onClose, onImageClick }: { p: Project; color: string; onClose: () => void; onImageClick?: (url: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const isReleased = p.status === "RELEASED" || p.status === "COMPLETED";
  const prog = calcProgress(p.checkpoints);
  const iconPath = ICON_PATHS[p.icon] ?? ICON_PATHS.Code;
  const dateLabel = formatDateSpan(p.startDate, p.endDate);

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <m.div
        className="relative z-10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#e2e8f0]"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0 }}
        style={{ backgroundColor: 'var(--theme-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-30 rounded-t-2xl" style={{ backgroundColor: 'var(--theme-card)' }}>
          {p.showImage && p.imageUrl ? (
            <div className="w-full h-52 overflow-hidden rounded-t-2xl relative group cursor-pointer flex items-center justify-center" onClick={() => { if (onImageClick) onImageClick(p.imageUrl); }}>
              <img src={p.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-50" />
              <img src={p.imageUrl} alt={p.title} loading="lazy" decoding="async" className="relative z-10 w-full h-full object-contain transition-transform group-hover:scale-[1.02] duration-500"/>
              {onImageClick && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg></div>}
            </div>
          ) : (
            <div className="w-full h-40 flex items-center justify-center rounded-t-2xl" style={{ backgroundColor: `${color}08` }}>
              <svg className="w-14 h-14" style={{ color: `${color}50` }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/></svg>
            </div>
          )}
          <div className="px-6 pt-4 pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>{p.title}</h2>
              {isReleased ? (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3" style={{ color, backgroundColor: `${color}10` }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Completed
                </span>
              ) : (
                <span className="text-sm font-bold" style={{ color }}>{prog}%</span>
              )}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-3 right-3 z-40 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[#64748b] hover:text-[#0f172a] shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto p-6 flex-1 flex flex-col gap-4">
          {p.description && <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-description)' }}>{p.description}</p>}
          <div className="flex flex-wrap items-center gap-2">
            {p.projectType && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ color, backgroundColor: `${color}10` }}>{PROJECT_TYPE_LABELS[p.projectType] || p.projectType}</span>
            )}
            {dateLabel && (
              <span className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] text-xs font-medium text-[#64748b]">{dateLabel}</span>
            )}
          </div>
          {p.techStack.filter(t => t.technologyName).length > 0 && (
            <div className="flex flex-wrap gap-1.5">{p.techStack.filter(t => t.technologyName).map((t: TechStack, i: number) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] text-xs font-medium text-[#475569]">{t.technologyName}</span>
            ))}</div>
          )}
          {p.links.filter(l => l.url && l.url !== "#").length > 0 && (
            <div className="flex flex-wrap gap-2">{p.links.filter(l => l.url && l.url !== "#").map((l: ProjectLink, i: number) => (
              <a key={i} href={ensureHttps(l.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e2e8f0] text-sm font-medium text-[#475569] hover:border-[#c7d2fe] hover:text-[#6366f1] hover:bg-[#fafafe] transition-all">
                <LinkIcon type={l.type}/>{linkLabel(l.type)}
              </a>
            ))}</div>
          )}
          {p.checkpoints.length > 0 && (
            <div>
              <div className="w-full h-2 bg-[#f1f5f9] rounded-full mb-3 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${prog}%`, background: prog === 100 ? "#22c55e" : color }}/>
              </div>
              <div className="space-y-2">{p.checkpoints.map((cp: Checkpoint, i: number) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cp.isCompleted ? "#22c55e" : "#d1d5db" }}/>
                  <span className={`text-sm flex-1 ${cp.isCompleted ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>{cp.title}</span>
                  <span className="text-xs text-[#cbd5e1]">{cp.percentage}%</span>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      </m.div>
    </m.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PortfolioView — full portfolio renderer.
   Render order: UserInfo → SocialLinks → Skills → Projects
   ═══════════════════════════════════════════════════════ */
export default function PortfolioView({ profile, projects, skills = [], onLightbox }: { profile: Profile; projects: Project[]; skills?: Skill[]; onLightbox?: (url: string) => void }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [localLightbox, setLocalLightbox] = useState<string | null>(null);
  const theme = profile.theme ?? DEFAULT_THEME;
  const color = theme.colors.accent;
  const layout = profile.layoutStyle || "CLASSIC";
  const ts = getThemeStyles(theme);
  const visibleProjects = projects.filter(p => p.visible !== false);
  const released = visibleProjects.filter(p => p.status === "RELEASED" || p.status === "COMPLETED");
  const inProgress = visibleProjects.filter(p => p.status === "IN_PROGRESS");

  const handleImageClick = (url: string) => {
    if (onLightbox) onLightbox(url);
    else setLocalLightbox(url);
  };

  const cardSty = theme.cardStyle;
  const renderGrid = (items: Project[]) => {
    if (layout === "MINIMAL") {
      return <div className="max-w-2xl mx-auto">{items.map(p => <MinimalCard key={p.id} p={p} color={color} onClick={() => setSelectedProject(p)} onImageClick={handleImageClick} cardStyle={cardSty}/>)}</div>;
    }
    if (layout === "CAROUSEL") {
      return (
        <div className="flex overflow-x-auto snap-x gap-6 pb-6 scrollbar-thin">
          {items.map(p => <CarouselCard key={p.id} p={p} color={color} onClick={() => setSelectedProject(p)} onImageClick={handleImageClick} cardStyle={cardSty}/>)}
        </div>
      );
    }
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{items.map(p => <ProjectCard key={p.id} p={p} color={color} onClick={() => setSelectedProject(p)} onImageClick={handleImageClick} cardStyle={cardSty}/>)}</div>;
  };

  const renderProjects = () => {
    if (layout === "TIMELINE") {
      const sorted = [...visibleProjects].sort((a, b) => (b.startDate || "0000").localeCompare(a.startDate || "0000"));
      if (sorted.length === 0) return null;
      return (
        <section className="px-6 pb-8">
          <div className="max-w-2xl mx-auto">
            {sorted.map((p, i) => <TimelineNode key={p.id} p={p} color={color} onClick={() => setSelectedProject(p)} index={i} cardStyle={cardSty}/>)}
          </div>
        </section>
      );
    }
    if (visibleProjects.length === 0) return null;
    return (
      <section className="px-6 pb-8">
        <div className="space-y-10">
          {released.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <h2 className="text-lg font-semibold" style={{ color: ts.vars['--text'] }}>Completed Projects</h2>
                <span className="text-xs ml-1" style={{ color: ts.vars['--text-secondary'] }}>({released.length})</span>
              </div>
              {renderGrid(released)}
            </div>
          )}
          {inProgress.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}/>
                <h2 className="text-lg font-semibold" style={{ color: ts.vars['--text'] }}>In Progress</h2>
                <span className="text-xs ml-1" style={{ color: ts.vars['--text-secondary'] }}>({inProgress.length})</span>
              </div>
              {renderGrid(inProgress)}
            </div>
          )}
        </div>
      </section>
    );
  };

  const fontStyle = getFontStyle(theme.fontFamily);
  const themeVars = {
    '--theme-bg': theme.colors.background,
    '--theme-text': theme.colors.text,
    '--theme-accent': theme.colors.accent,
    '--theme-description': theme.colors.descriptionColor ?? '#64748b',
    '--theme-card': theme.colors.card ?? '#f8f9fa',
  } as React.CSSProperties;

  return (
    <LazyMotion features={domAnimation}>
    <div style={{ ...ts.wrapperBg, ...textureCSS(theme.texture, color), ...fontStyle, ...themeVars }} className="rounded-xl min-h-[200px] relative">
      <AnimatePresence>{localLightbox && <ImageLightbox url={localLightbox} onClose={() => setLocalLightbox(null)} />}</AnimatePresence>
      <AnimatePresence>{selectedProject && <DetailModal p={selectedProject} color={color} onClose={() => setSelectedProject(null)} onImageClick={handleImageClick}/>}</AnimatePresence>

      {/* ── UserInfo ── */}
      <UserInfoSection profile={profile} color={color} ts={ts} />

      {/* ── Social Links ── */}
      {profile.showLinks !== false && <SocialLinksSection links={profile.socialLinks || []} layout={profile.socialLinksLayout || 'ICONS'} color={color} ts={ts} buttonStyle={theme.buttonStyle} cardStyle={theme.cardStyle} />}

      {/* ── Skills ── */}
      {profile.showSkills !== false && <SkillsSection skills={skills} color={color} ts={ts} cardStyle={theme.cardStyle} />}

      {/* ── Projects ── */}
      {profile.showProjects !== false && renderProjects()}
    </div>
    </LazyMotion>
  );
}
