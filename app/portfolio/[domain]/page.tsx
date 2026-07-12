/* ─── Public Portfolio Page ──────────────────────────── */

import { cache } from "react";
import type { Metadata } from "next";
import PortfolioView from "@/components/PortfolioView";
import VisitTracker from "@/components/VisitTracker";


const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/portfolio-df758/databases/(default)/documents";

/* ─── Types ──────────────────────────────────────────── */
interface FirestoreValue { stringValue?: string; booleanValue?: boolean; integerValue?: string; doubleValue?: number; arrayValue?: { values?: FirestoreValue[] }; mapValue?: { fields?: Record<string, FirestoreValue> }; }
interface FirestoreDoc { name: string; fields: Record<string, FirestoreValue>; }

import type {
  Project,
  Profile,
  SocialLink,
} from "@/types/portfolio";
import { DEFAULT_THEME } from "@/types/portfolio";
import type { Theme, SocialLinksLayout, UserInfoLayout } from "@/types/portfolio";

/* ─── Firestore helpers ──────────────────────────────── */
function fStr(doc: FirestoreDoc, key: string): string { return doc.fields?.[key]?.stringValue ?? ""; }
function fBool(doc: FirestoreDoc, key: string): boolean { return doc.fields?.[key]?.booleanValue ?? false; }
function fArr(doc: FirestoreDoc, key: string): FirestoreValue[] { return doc.fields?.[key]?.arrayValue?.values ?? []; }
function fNum(doc: FirestoreDoc, key: string): number { return Number(doc.fields?.[key]?.integerValue ?? doc.fields?.[key]?.doubleValue ?? 0); }
function fMapStr(v: FirestoreValue, key: string): string { return v.mapValue?.fields?.[key]?.stringValue ?? ""; }
function fMapNum(v: FirestoreValue, key: string): number { return Number(v.mapValue?.fields?.[key]?.integerValue ?? v.mapValue?.fields?.[key]?.doubleValue ?? 0); }
function fMapBool(v: FirestoreValue, key: string): boolean { return v.mapValue?.fields?.[key]?.booleanValue ?? false; }
function docId(doc: FirestoreDoc): string { const parts = doc.name.split("/"); return parts[parts.length - 1]; }

/* ─── Data fetching ──────────────────────────────────── */
// cache() memoizes per request so generateMetadata + the page share one Firestore query
const fetchProfile = cache(async function fetchProfile(username: string): Promise<(Profile & { userId: string }) | null> {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "profiles" }], where: { fieldFilter: { field: { fieldPath: "username" }, op: "EQUAL", value: { stringValue: username } } }, limit: 1 } }),
    next: { revalidate: 30 },
  });
  // Distinguish backend outage (→ error boundary, retry) from a genuinely
  // unknown username (→ NotFound page)
  if (!res.ok) throw new Error(`Firestore profiles query failed: ${res.status}`);
  const data = await res.json();
  const doc = data?.[0]?.document as FirestoreDoc | undefined;
  if (!doc) return null;
  // Migrate socialLinks: new format is array, legacy is map {github, linkedin, twitter}
  const rawSocialLinks = doc.fields?.socialLinks?.arrayValue?.values;
  const sl = doc.fields?.socialLinks?.mapValue?.fields;
  let migratedSocialLinks: SocialLink[] = [];
  if (rawSocialLinks && rawSocialLinks.length > 0) {
    migratedSocialLinks = rawSocialLinks.map(v => ({
      id: fMapStr(v, 'id') || crypto.randomUUID(),
      type: (fMapStr(v, 'type') || 'CUSTOM') as SocialLink['type'],
      title: fMapStr(v, 'title'),
      url: fMapStr(v, 'url'),
      imageUrl: fMapStr(v, 'imageUrl'),
      visible: v.mapValue?.fields?.visible?.booleanValue ?? true,
    }));
  } else if (sl) {
    if (sl.github?.stringValue) migratedSocialLinks.push({ id: crypto.randomUUID(), type: 'GITHUB', title: 'GitHub', url: sl.github.stringValue, visible: true });
    if (sl.linkedin?.stringValue) migratedSocialLinks.push({ id: crypto.randomUUID(), type: 'LINKEDIN', title: 'LinkedIn', url: sl.linkedin.stringValue, visible: true });
    if (sl.twitter?.stringValue) migratedSocialLinks.push({ id: crypto.randomUUID(), type: 'TWITTER', title: 'Twitter', url: sl.twitter.stringValue, visible: true });
  }
  // Migrate legacy themeColor → theme
  const rawTheme = doc.fields?.theme?.mapValue?.fields;
  const legacyAccent = fStr(doc, "themeColor") || "#6366f1";
  const colorFields = rawTheme?.colors?.mapValue?.fields;
  const legacyCard = colorFields?.card?.stringValue ?? colorFields?.projectCard?.stringValue ?? '#f8f9fa';
  const migratedTheme: Theme = rawTheme ? {
    preset: (rawTheme?.preset?.stringValue as Theme['preset']) ?? 'MINIMAL',
    colors: {
      background: colorFields?.background?.stringValue ?? '#ffffff',
      card: legacyCard,
      accent: colorFields?.accent?.stringValue ?? legacyAccent,
      text: colorFields?.text?.stringValue ?? '#0f172a',
      descriptionColor: colorFields?.descriptionColor?.stringValue ?? '#64748b',
    },
    texture: (rawTheme?.texture?.stringValue as Theme['texture']) ?? 'NONE',
    fontFamily: rawTheme?.fontFamily?.stringValue as Theme['fontFamily'] | undefined,
    cardStyle: rawTheme?.cardStyle?.stringValue as Theme['cardStyle'] | undefined,
    buttonStyle: rawTheme?.buttonStyle?.stringValue as Theme['buttonStyle'] | undefined,
  } : { ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors, accent: legacyAccent } };
  return {
    fullName: fStr(doc, "fullName"), title: fStr(doc, "title"), bio: fStr(doc, "bio"),
    location: fStr(doc, "location"), username: fStr(doc, "username"), avatarUrl: fStr(doc, "avatarUrl"),
    showAvatar: fBool(doc, "showAvatar") || (doc.fields?.showAvatar === undefined),
    theme: migratedTheme,
    socialLinks: migratedSocialLinks,
    socialLinksLayout: (fStr(doc, "socialLinksLayout") as SocialLinksLayout) || 'ICONS',
    userInfoLayout: (fStr(doc, "userInfoLayout") as UserInfoLayout) || 'LEFT',
    // Missing field must mean visible — fBool would coerce absent to false
    showLinks: doc.fields?.showLinks?.booleanValue ?? true,
    showProjects: doc.fields?.showProjects?.booleanValue ?? true,
    showSkills: doc.fields?.showSkills?.booleanValue ?? true,
    portfolioVisibility: (fStr(doc, "portfolioVisibility") as Profile["portfolioVisibility"]) || "ALL",
    layoutStyle: fStr(doc, "layoutStyle") === 'LINK_IN_BIO' ? 'CLASSIC' : ((fStr(doc, "layoutStyle") as Profile["layoutStyle"]) || "CLASSIC"),
    accountType: (fStr(doc, "accountType") as Profile["accountType"]) || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skills: fArr(doc, "skills").map((v: any) => ({ id: fMapStr(v, "id") || crypto.randomUUID(), name: fMapStr(v, "name"), level: fMapNum(v, "level") || 50, visible: v.mapValue?.fields?.visible?.booleanValue ?? true })),
    userId: fStr(doc, "userId"),
  };
});

/* ─── Metadata ───────────────────────────────────────── */
export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const profile = await fetchProfile(domain);
  if (!profile) {
    return { title: "Portfolio Not Found", robots: { index: false } };
  }
  const name = profile.fullName || domain;
  const title = profile.title ? `${name} — ${profile.title}` : `${name} — Portfolio`;
  const description = profile.bio || `Check out ${name}'s portfolio, built with Viefolio.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://${domain}.viefolio.com`,
      siteName: "Viefolio",
      ...(profile.avatarUrl && profile.showAvatar ? { images: [{ url: profile.avatarUrl, alt: name }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(profile.avatarUrl && profile.showAvatar ? { images: [profile.avatarUrl] } : {}),
    },
  };
}

async function fetchProjects(userId: string): Promise<Project[]> {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "projects" }], where: { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: userId } } } } }),
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Firestore projects query failed: ${res.status}`);
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).filter((r: any) => r.document).map((r: any) => {
    const doc = r.document as FirestoreDoc;
    const rawStatus = (fStr(doc, "status") || "IN_PROGRESS").toUpperCase();
    return {
      id: docId(doc),
      title: fStr(doc, "title") || fStr(doc, "name") || "Untitled",
      description: fStr(doc, "description"),
      status: rawStatus === "COMPLETED" ? "RELEASED" : rawStatus,
      imageUrl: fStr(doc, "imageUrl"),
      showImage: fBool(doc, "showImage"),
      icon: fStr(doc, "icon") || "Code",
      projectType: (fStr(doc, "projectType") || "SOLO") as Project["projectType"],
      startDate: fStr(doc, "startDate") || "",
      endDate: fStr(doc, "endDate") || "",
      techStack: fArr(doc, "techStack").map(v => ({ technologyName: fMapStr(v, "technologyName") || fMapStr(v, "name") })),
      checkpoints: fArr(doc, "checkpoints").map((v, i) => ({ title: fMapStr(v, "title"), percentage: fMapNum(v, "percentage"), isCompleted: fMapBool(v, "isCompleted"), orderIndex: fMapNum(v, "orderIndex") || i })).sort((a, b) => a.orderIndex - b.orderIndex),
      links: fArr(doc, "links").map(v => ({ type: fMapStr(v, "type"), url: fMapStr(v, "url") || fMapStr(v, "link") })),
      orderIndex: fNum(doc, "orderIndex"),
      visible: doc.fields?.visible?.booleanValue ?? true,
    };
  }).sort((a: Project, b: Project) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

/* ─── 404 Component ──────────────────────────────────── */
function NotFound({ domain }: { domain: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <span className="text-white font-bold text-2xl">V</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Portfolio Not Found</h1>
        <p className="text-sm text-[#64748b] mb-6">The portfolio <span className="font-semibold text-[#0f172a]">{domain}.viefolio.com</span> doesn&apos;t exist yet.</p>
        <a href="https://viefolio.com" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-200/50" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          Create your portfolio →
        </a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default async function PortfolioPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const profileData = await fetchProfile(domain);
  if (!profileData) return <NotFound domain={domain} />;

  const { userId, ...profile } = profileData;
  let projects = await fetchProjects(userId);

  // Apply visibility filters
  projects = projects.filter(p => p.visible !== false);
  if (profile.portfolioVisibility === "RELEASED_ONLY") {
    projects = projects.filter(p => p.status === "RELEASED" || p.status === "COMPLETED");
  }

  const color = profile.theme.colors.accent;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: profile.theme.colors.background }}>
      <VisitTracker ownerUid={userId} />
      {/* Glass Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ backgroundColor: `${profile.theme.colors.background}cc`, borderColor: `${color}15` }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Viefolio" className="logo-mark w-12 h-12" />
            <span className="text-m font-semibold tracking-tight" style={{ color: profile.theme.colors.text }}>{profile.fullName || domain}</span>
          </div>
          <a href="https://viefolio.com" className="text-xs hover:opacity-70 transition-colors font-medium" style={{ color }}>Built with Viefolio</a>
        </div>
      </nav>

      {/* Portfolio — UserInfo, SocialLinks, Skills, Projects all rendered by PortfolioView */}
      <div className="max-w-5xl mx-auto px-6 flex-1 w-full">
        <PortfolioView profile={profile} projects={projects} skills={profile.skills} />
      </div>

      {/* Glass Footer */}
      <footer className="border-t backdrop-blur-xl" style={{ backgroundColor: `${profile.theme.colors.background}cc`, borderColor: `${color}15` }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Viefolio" className="logo-mark w-8 h-8" />
            <span className="text-xs" style={{ color: `${profile.theme.colors.text}80` }}>Powered by <a href="https://viefolio.com" className="font-semibold transition-colors hover:opacity-70" style={{ color }}>Viefolio</a></span>
          </div>
          <span className="text-[10px]" style={{ color: `${profile.theme.colors.text}40` }}>{domain}.viefolio.com</span>
        </div>
      </footer>
    </div>
  );
}

