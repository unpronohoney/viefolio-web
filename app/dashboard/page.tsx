"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Reorder, AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  addDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import PortfolioView, { ImageLightbox } from "@/components/PortfolioView";
import OnboardingModal from "@/components/OnboardingModal";
import { markOwnerDevice, recordWebSession, dailySeries, todayKey } from "@/lib/insights";
import type { DeviceSession, VisitStats } from "@/lib/insights";
import { DEFAULT_THEME, THEME_PRESETS } from "@/types/portfolio";
import type { ThemePreset, ThemeTexture, Theme, ThemeFont, CardStyle, ButtonStyle } from "@/types/portfolio";

/* ─── Constants ──────────────────────────────────────── */
const PROJECT_ICONS = [
  { name: "Code", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
  { name: "Mobile", icon: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" },
  { name: "Globe", icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" },
  { name: "Database", icon: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" },
  { name: "Palette", icon: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" },
  { name: "Camera", icon: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" },
  { name: "PenTool", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" },
  { name: "Video", icon: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" },
  { name: "Mic", icon: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" },
  { name: "Sparkles", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" },
];
const LAYOUT_OPTIONS = [
  { value: "CLASSIC" as const, label: "Classic Grid", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25h2.25A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" },
  { value: "MINIMAL" as const, label: "Minimal List", icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" },
  { value: "CAROUSEL" as const, label: "Carousel", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v13.5a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 19.5V6zm9.75 0a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" },
  { value: "TIMELINE" as const, label: "Timeline", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
];

/* ─── Types ──────────────────────────────────────────── */
import type {
  Checkpoint,
  Project,
  SocialLink,
  Profile,
  Skill,
  SocialLinksLayout,
  UserInfoLayout,
} from "@/types/portfolio";

/* ─── Helpers ────────────────────────────────────────── */
function sorted(cps: Checkpoint[]): Checkpoint[] { return [...cps].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)); }

const defaultProfile: Profile = { fullName: "", title: "", bio: "", location: "", username: "", avatarUrl: "", showAvatar: true, theme: DEFAULT_THEME, socialLinks: [], socialLinksLayout: 'ICONS', userInfoLayout: 'LEFT', showLinks: true, showProjects: true, showSkills: true, portfolioVisibility: "ALL", layoutStyle: "CLASSIC", skills: [], userId: "" };

/* ═════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const VALID_TABS = ["profile", "links", "projects", "skills", "appearance"] as const;
  type Tab = typeof VALID_TABS[number];
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      const saved = localStorage.getItem("viefolio-active-tab");
      return (VALID_TABS as readonly string[]).includes(saved ?? "") ? (saved as Tab) : "projects";
    } catch { return "projects"; }
  });
  const switchTab = (tab: Tab) => { setActiveTab(tab); try { localStorage.setItem("viefolio-active-tab", tab); } catch { /* ignore */ } };
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Toast notifications (replaces blocking alert() calls)
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const showToast = useCallback((msg: string, type: "error" | "success" = "error") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Profile state
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Username check state
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const usernameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedUsernameRef = useRef<string>("");

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteCodeSent, setDeleteCodeSent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [projectOrderChanged, setProjectOrderChanged] = useState(false);
  const [showReorder, setShowReorder] = useState(false);

  // Insights state
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[] | null>(null);

  // Account panel (avatar circle, top-right)
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [pwCode, setPwCode] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSignOutAll, setPwSignOutAll] = useState(true);
  const [pwSaving, setPwSaving] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwCodeSent, setPwCodeSent] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // Edit modal state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [projectImgUploading, setProjectImgUploading] = useState(false);
  const [editLightbox, setEditLightbox] = useState<string | null>(null);
  const backupCheckpoints = useRef<Checkpoint[]>([]);

  /* ─── Escape closes the topmost modal ──────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editLightbox) setEditLightbox(null);
      else if (showAccountPanel && !pwSaving) setShowAccountPanel(false);
      else if (showThemeModal) setShowThemeModal(false);
      else if (showReorder) setShowReorder(false);
      else if (showDeleteModal && !deleting) setShowDeleteModal(false);
      else if (showMobilePreview) setShowMobilePreview(false);
      else if (editingProject) setEditingProject(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editLightbox, showAccountPanel, pwSaving, showThemeModal, showReorder, showDeleteModal, deleting, showMobilePreview, editingProject]);

  /* ─── Auth ─────────────────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
      else setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  /* ─── Device session + own-device visit exclusion ──── */
  useEffect(() => {
    if (!user) return;
    markOwnerDevice(user.uid);
    recordWebSession(user.uid);
  }, [user]);

  /* ─── Profile listener ─────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "profiles", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        // Migrate legacy themeColor → theme object
        const legacyCard = d.theme?.colors?.card ?? d.theme?.colors?.projectCard ?? '#f8f9fa';
        // Every optional theme field needs a concrete default — Firestore
        // rejects writes containing undefined, which would break all saves.
        const migratedTheme: Theme = d.theme ? { preset: d.theme.preset ?? 'MINIMAL', colors: { background: d.theme.colors?.background ?? '#ffffff', card: legacyCard, accent: d.theme.colors?.accent ?? (d.themeColor ?? '#6366f1'), text: d.theme.colors?.text ?? '#0f172a', descriptionColor: d.theme.colors?.descriptionColor ?? '#64748b' }, texture: d.theme.texture ?? 'NONE', fontFamily: d.theme.fontFamily ?? 'SANS', cardStyle: d.theme.cardStyle ?? 'FLAT', buttonStyle: d.theme.buttonStyle ?? 'ROUNDED' } : { ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors, accent: d.themeColor ?? '#6366f1' } };
        // Migrate legacy socialLinks { github, linkedin, twitter } → SocialLink[]
        let migratedLinks: SocialLink[] = [];
        if (Array.isArray(d.socialLinks)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          migratedLinks = d.socialLinks.map((l: any) => ({ id: l.id ?? crypto.randomUUID(), type: l.type ?? 'CUSTOM', title: l.title ?? '', url: l.url ?? '', imageUrl: l.imageUrl ?? '', visible: l.visible ?? true }));
        } else if (d.socialLinks && typeof d.socialLinks === 'object') {
          const sl = d.socialLinks as Record<string, string>;
          if (sl.github) migratedLinks.push({ id: crypto.randomUUID(), type: 'GITHUB', title: 'GitHub', url: sl.github, visible: true });
          if (sl.linkedin) migratedLinks.push({ id: crypto.randomUUID(), type: 'LINKEDIN', title: 'LinkedIn', url: sl.linkedin, visible: true });
          if (sl.twitter) migratedLinks.push({ id: crypto.randomUUID(), type: 'TWITTER', title: 'Twitter', url: sl.twitter, visible: true });
        }
        savedUsernameRef.current = d.username ?? "";
        setProfile({
          fullName: d.fullName ?? "", title: d.title ?? "", bio: d.bio ?? "",
          location: d.location ?? "", username: d.username ?? "",
          avatarUrl: d.avatarUrl ?? "", showAvatar: d.showAvatar ?? true,
          theme: migratedTheme,
          socialLinks: migratedLinks,
          socialLinksLayout: (d.socialLinksLayout as SocialLinksLayout) ?? 'ICONS',
          userInfoLayout: (d.userInfoLayout as UserInfoLayout) ?? 'LEFT',
          showLinks: d.showLinks ?? true,
          showProjects: d.showProjects ?? true,
          showSkills: d.showSkills ?? true,
          portfolioVisibility: d.portfolioVisibility ?? "ALL",
          layoutStyle: d.layoutStyle === 'LINK_IN_BIO' ? 'CLASSIC' : (d.layoutStyle ?? "CLASSIC"),
          accountType: d.accountType,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          skills: (d.skills ?? []).map((s: any) => ({ id: s.id ?? crypto.randomUUID(), name: s.name ?? "", level: s.level ?? 50, visible: s.visible ?? true })),
          userId: user.uid,
        });
        if (!d.accountType) setShowOnboarding(true);
        else setShowOnboarding(false);
      } else {
        savedUsernameRef.current = "";
        setProfile({ ...defaultProfile, userId: user.uid });
        setShowOnboarding(true);
      }
    }, (err) => console.debug("profile listener closed:", err.code));
    return () => unsub();
  }, [user]);

  /* ─── Debounced username check ─────────────────────── */
  const checkUsername = useCallback((val: string) => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    if (!val || val.length < 2) { setUsernameStatus("idle"); setUsernameSuggestions([]); return; }
    setUsernameStatus("checking");
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, "usernames", val));
        let taken = snap.exists() && snap.data()?.userId !== user?.uid;
        if (!snap.exists()) {
          // Legacy fallback: profiles saved before username reservations existed
          const legacy = await getDocs(query(collection(db, "profiles"), where("username", "==", val)));
          taken = legacy.docs.some(d => d.id !== user?.uid);
        }
        if (taken) {
          setUsernameStatus("taken");
          setUsernameSuggestions([`${val}-dev`, `${val}-portfolio`, `${val}hq`]);
        } else {
          setUsernameStatus("available");
          setUsernameSuggestions([]);
        }
      } catch { setUsernameStatus("idle"); }
    }, 500);
  }, [user]);

  /* ─── Projects listener ────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "projects"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs: Project[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? data.name ?? "Untitled",
          description: data.description ?? "",
          status: ((data.status ?? "IN_PROGRESS").toUpperCase() === "COMPLETED" ? "RELEASED" : (data.status ?? "IN_PROGRESS").toUpperCase()) as Project["status"],
          imageUrl: data.imageUrl ?? "",
          showImage: data.showImage ?? false,
          icon: data.icon ?? "Code",
          projectType: (data.projectType ?? "SOLO") as Project["projectType"],
          startDate: data.startDate ?? "",
          endDate: data.endDate ?? (data.dateSpan ? "" : ""),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          techStack: (data.techStack ?? []).map((t: any) => ({ id: t.id ?? crypto.randomUUID(), technologyName: typeof t === "string" ? t : (t.technologyName ?? t.name ?? "") })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          checkpoints: (data.checkpoints ?? []).map((cp: any, idx: number) => ({ id: cp.id ?? `cp-${idx}`, title: cp.title ?? "", percentage: cp.percentage ?? 0, isCompleted: cp.isCompleted ?? false, orderIndex: cp.orderIndex ?? idx })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          links: (data.links ?? []).map((l: any) => ({ id: l.id ?? crypto.randomUUID(), type: l.type ?? "WEBSITE", url: l.url ?? l.link ?? "#" })),
          userId: data.userId ?? "",
        };
      });
      setProjects(docs);
      if (docs.length > 0 && !docs.find(d => d.id === selectedId)) setSelectedId(docs[0].id);
    }, (err) => console.debug("projects listener closed:", err.code));
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ─── Insights listeners (visit stats + devices) ───── */
  useEffect(() => {
    if (!user) return;
    const unsubStats = onSnapshot(doc(db, "stats", user.uid), (snap) => {
      const d = snap.data();
      setVisitStats({
        totalVisits: (d?.totalVisits as number) ?? 0,
        daily: (d?.daily as Record<string, number>) ?? {},
        lastVisitAt: d?.lastVisitAt ?? null,
      });
    }, (err) => console.debug("stats listener closed:", err.code));
    const unsubSessions = onSnapshot(collection(db, "profiles", user.uid, "sessions"), (snap) => {
      const docs: DeviceSession[] = snap.docs.map((s) => {
        const d = s.data();
        return {
          id: s.id,
          platform: d.platform ?? "WEB",
          deviceModel: d.deviceModel ?? "Unknown device",
          osVersion: d.osVersion ?? "",
          location: d.location ?? "",
          lastSignIn: d.lastSignIn ?? null,
        };
      });
      docs.sort((a, b) => (b.lastSignIn?.seconds ?? 0) - (a.lastSignIn?.seconds ?? 0));
      setDeviceSessions(docs);
    }, (err) => console.debug("sessions listener closed:", err.code));
    return () => { unsubStats(); unsubSessions(); };
  }, [user]);

  /* ─── Change password: email code verifies inbox access ─ */
  async function requestPasswordCode() {
    if (!user) return;
    setPwError(""); setPwSuccess("");
    if (pwNew.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (pwNew !== pwConfirm) { setPwError("New passwords don't match."); return; }
    setPwSaving(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/password-otp/request", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setPwError(data.error ?? "Couldn't send the code. Try again."); return; }
      setPwCodeSent(true);
      setPwSuccess(`Code sent to ${user.email}. It expires in 10 minutes.`);
    } catch {
      setPwError("Couldn't send the code. Try again.");
    } finally {
      setPwSaving(false);
    }
  }

  async function confirmPasswordChange() {
    if (!user?.email) return;
    setPwError(""); setPwSuccess("");
    setPwSaving(true);
    try {
      const idToken = await user.getIdToken();
      const deviceId = localStorage.getItem("viefolio-device-id") ?? "";
      const res = await fetch("/api/password-otp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ code: pwCode, newPassword: pwNew, signOutOtherDevices: pwSignOutAll, keepSessionId: `web-${deviceId}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setPwError(data.error ?? "Couldn't change the password."); return; }
      // Server-side password change revokes this session's tokens too — sign in fresh
      await signInWithEmailAndPassword(auth, user.email, pwNew);
      setPwCode(""); setPwNew(""); setPwConfirm(""); setPwCodeSent(false);
      setPwSuccess(pwSignOutAll ? "Password changed. Other devices are being signed out." : "Password changed.");
    } catch {
      setPwError("Password was changed, but re-signing in failed — please sign in again.");
    } finally {
      setPwSaving(false);
    }
  }

  /* ─── Save Profile ─────────────────────────────────── */
  const saveProfile = useCallback(async () => {
    if (!user) return;
    setProfileSaving(true);
    try {
      const payload = {
        fullName: profile.fullName, title: profile.title, bio: profile.bio,
        location: profile.location, username: profile.username,
        avatarUrl: profile.avatarUrl, showAvatar: profile.showAvatar,
        theme: profile.theme,
        socialLinks: profile.socialLinks.map(l => ({ id: l.id, type: l.type, title: l.title, url: l.url, imageUrl: l.imageUrl ?? '', visible: l.visible ?? true })),
        socialLinksLayout: profile.socialLinksLayout,
        userInfoLayout: profile.userInfoLayout,
        showLinks: profile.showLinks ?? true,
        showProjects: profile.showProjects ?? true,
        showSkills: profile.showSkills ?? true,
        portfolioVisibility: profile.portfolioVisibility,
        layoutStyle: profile.layoutStyle,
        // Firestore rejects undefined — use null when onboarding hasn't run yet
        accountType: profile.accountType ?? null,
        skills: profile.skills.map(s => ({ id: s.id, name: s.name, level: s.level, visible: s.visible ?? true })),
        userId: user.uid,
      };
      // Transaction: claim usernames/{username} (doc ID = username) atomically
      // so two accounts can never end up with the same subdomain.
      const newUsername = profile.username;
      const oldUsername = savedUsernameRef.current;
      // Legacy guard: usernames saved before reservations existed live only on
      // profile docs, which a transaction can't query — check them up front.
      if (newUsername && newUsername !== oldUsername) {
        const legacy = await getDocs(query(collection(db, "profiles"), where("username", "==", newUsername)));
        if (legacy.docs.some(d => d.id !== user.uid)) throw new Error("USERNAME_TAKEN");
      }
      await runTransaction(db, async (tx) => {
        // All reads must happen before any writes
        const newRes = newUsername ? await tx.get(doc(db, "usernames", newUsername)) : null;
        const oldRes = oldUsername && oldUsername !== newUsername ? await tx.get(doc(db, "usernames", oldUsername)) : null;
        if (newRes?.exists() && newRes.data()?.userId !== user.uid) {
          throw new Error("USERNAME_TAKEN");
        }
        if (newUsername && !newRes?.exists()) {
          tx.set(doc(db, "usernames", newUsername), { userId: user.uid });
        }
        if (oldRes?.exists() && oldRes.data()?.userId === user.uid) {
          tx.delete(doc(db, "usernames", oldUsername));
        }
        tx.set(doc(db, "profiles", user.uid), payload, { merge: true });
      });
      savedUsernameRef.current = newUsername;
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      if (err instanceof Error && err.message === "USERNAME_TAKEN") {
        setUsernameStatus("taken");
        setUsernameSuggestions([`${profile.username}-dev`, `${profile.username}-portfolio`, `${profile.username}hq`]);
        showToast(`"${profile.username}" is already taken — try one of the suggestions.`);
      } else {
        console.error("Profile save error:", err);
        showToast("Failed to save profile. Please try again.");
      }
    } finally {
      setProfileSaving(false);
    }
  }, [user, profile, showToast]);

  /* ─── Save Edited Project ──────────────────────────── */
  async function saveEditedProject() {
    if (!editingProject) return;
    setEditSaving(true);
    try {
      // Filter out empty-named checkpoints
      const validCheckpoints = editingProject.checkpoints.filter(cp => cp.title.trim() !== "");
      const payload = {
        title: editingProject.title,
        description: editingProject.description,
        status: editingProject.status,
        imageUrl: editingProject.imageUrl,
        showImage: editingProject.showImage,
        icon: editingProject.icon,
        projectType: editingProject.projectType,
        startDate: editingProject.startDate,
        endDate: editingProject.endDate,
        techStack: editingProject.techStack.map(t => ({ id: t.id, technologyName: t.technologyName })),
        checkpoints: validCheckpoints.map(cp => ({ id: cp.id, title: cp.title, percentage: cp.percentage, isCompleted: cp.isCompleted, orderIndex: cp.orderIndex })),
        links: editingProject.links.map(l => ({ id: l.id, type: l.type, url: l.url })),
        userId: editingProject.userId,
      };
      if (editingProject.id.startsWith("new_")) {
        // New project — create in Firestore
        await addDoc(collection(db, "projects"), payload);
      } else {
        await updateDoc(doc(db, "projects", editingProject.id), payload);
      }
      setEditingProject(null);
    } catch (err) {
      console.error("Project save error:", err);
      showToast("Failed to save project. Please try again.");
    } finally {
      setEditSaving(false);
    }
  }

  /* ─── Delete Project ──────────────────────────────── */
  async function deleteProject(projectId: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      if (!projectId.startsWith("new_")) {
        await deleteDoc(doc(db, "projects", projectId));
      }
      setEditingProject(null);
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete project.");
    }
  }

  async function handleSignOut() { await signOut(auth); router.replace("/login"); }

  /* ─── Delete Account ───────────────────────────────── */
  const isPasswordUser = user?.providerData.some(p => p.providerId === "password") ?? false;

  async function requestDeleteCode() {
    if (!user) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/password-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ purpose: "DELETE_ACCOUNT" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setDeleteError(data.error ?? "Couldn't send the code. Try again."); return; }
      setDeleteCodeSent(true);
    } catch {
      setDeleteError("Couldn't send the code. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function deleteAccount() {
    if (!user) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ code: deleteCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setDeleteError(data.error ?? "Couldn't delete the account. Try again."); return; }
      // Server removed the auth user and all data; drop the local session
      await signOut(auth).catch(() => {});
      router.replace("/");
    } catch {
      setDeleteError("Something went wrong deleting your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  /* ─── Save Project Order ───────────────────────────── */
  async function saveProjectOrder() {
    try {
      await Promise.all(projects.map(p => updateDoc(doc(db, "projects", p.id), { orderIndex: p.orderIndex })));
      setProjectOrderChanged(false);
      showToast("Project order saved.", "success");
    } catch (err) {
      console.error("Order save error:", err);
      showToast("Failed to save project order.");
    }
  }

  /* ─── Create New Project ────────────────────── */
  function createNewProject() {
    if (!user) return;
    const newProj: Project = {
      id: "new_" + crypto.randomUUID(),
      title: "", description: "", status: "IN_PROGRESS",
      imageUrl: "", showImage: false, icon: "Code",
      projectType: "SOLO", startDate: "", endDate: "",
      techStack: [], checkpoints: [], links: [], userId: user.uid,
    };
    backupCheckpoints.current = [];
    setEditingProject(newProj);
  }

  /* ─── Avatar Upload ─────────────────────────────── */
  async function uploadAvatar(file: File) {
    if (!user) return;
    setAvatarUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}/avatar`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProfile(p => ({ ...p, avatarUrl: url }));
      await setDoc(doc(db, "profiles", user.uid), { avatarUrl: url }, { merge: true });
    } catch (err) { console.error("Avatar upload error:", err); }
    finally { setAvatarUploading(false); }
  }

  /* ─── Project Image Upload ──────────────────────── */
  async function uploadProjectImage(file: File, projectId: string) {
    if (!user) return;
    setProjectImgUploading(true);
    try {
      // Path embeds the owner's uid so storage rules can verify ownership
      const storageRef = ref(storage, `project-images/${user.uid}/${projectId}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      if (editingProject && editingProject.id === projectId) {
        setEditingProject({ ...editingProject, imageUrl: url });
      }
    } catch (err) { console.error("Project image upload error:", err); }
    finally { setProjectImgUploading(false); }
  }

  const displayName = profile.fullName || user?.displayName || user?.email?.split("@")[0] || "User";
  const displayTitle = profile.title || "Developer & Creator";

  if (authLoading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#94a3b8]">Loading…</span>
      </div>
    </div>
  );
  if (!user) return null;

  /* ═══ RENDER ═══════════════════════════════════════════ */
  return (
    <MotionConfig reducedMotion="user">
    <div className="h-screen flex flex-col bg-white">
      {/* ─── Toast ───────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            style={{ x: "-50%" }}
            className={`fixed bottom-6 left-1/2 z-[110] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-[90vw] ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}
            role="status"
          >
            {toast.type === "success" ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{editLightbox && <ImageLightbox url={editLightbox} onClose={() => setEditLightbox(null)} />}</AnimatePresence>
      {/* ─── ACCOUNT PANEL (avatar circle) ───────────────── */}
      <AnimatePresence>
      {showAccountPanel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => !pwSaving && setShowAccountPanel(false)}
        >
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={e => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col"
          >
            {/* Panel header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-[#f1f5f9] flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-sm font-bold">{displayName.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{displayName}</p>
                <p className="text-xs text-[#94a3b8] truncate">{user?.email}</p>
              </div>
              <button onClick={() => !pwSaving && setShowAccountPanel(false)} className="p-2 rounded-lg hover:bg-[#f1f5f9] transition-colors">
                <svg className="w-4 h-4 text-[#64748b]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ── Insights ── */}
              <div>
                <h3 className="text-sm font-semibold text-[#0f172a] mb-1">Insights</h3>
                <p className="text-[11px] text-[#94a3b8] mb-3">Portfolio visits — your own devices aren&apos;t counted.</p>
                {visitStats === null ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map(i => <div key={i} className="h-[72px] rounded-xl bg-[#f1f5f9]" />)}
                    </div>
                    <div className="h-36 rounded-xl bg-[#f1f5f9]" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Total", value: visitStats.totalVisits },
                        { label: "Today", value: visitStats.daily?.[todayKey()] ?? 0 },
                        { label: "7 days", value: dailySeries(visitStats.daily ?? {}, 7).reduce((s, d) => s + d.count, 0) },
                      ].map(card => (
                        <div key={card.label} className="rounded-xl border border-[#f1f5f9] bg-white p-3.5 shadow-sm">
                          <p className="text-xl font-bold text-[#0f172a] tabular-nums">{card.value}</p>
                          <p className="text-[10px] text-[#94a3b8] mt-0.5">{card.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[#f1f5f9] bg-white p-4 shadow-sm">
                      {(() => {
                        const series = dailySeries(visitStats.daily ?? {}, 7);
                        const max = Math.max(1, ...series.map(d => d.count));
                        return (
                          <div className="flex items-end gap-2 h-24">
                            {series.map(d => (
                              <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[9px] text-[#64748b] tabular-nums">{d.count > 0 ? d.count : ""}</span>
                                <div className="w-full rounded-md transition-all duration-300" style={{ height: `${Math.max(4, (d.count / max) * 64)}px`, background: d.count > 0 ? "linear-gradient(180deg, #6366f1, #8b5cf6)" : "#f1f5f9" }} />
                                <span className="text-[9px] text-[#94a3b8]">{d.label}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Devices ── */}
              <div>
                <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Signed-in devices</h3>
                {deviceSessions === null ? (
                  <div className="space-y-2 animate-pulse">
                    {[0, 1].map(i => <div key={i} className="h-[58px] rounded-xl bg-[#f1f5f9]" />)}
                  </div>
                ) : deviceSessions.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] py-4 text-center border border-dashed border-[#e2e8f0] rounded-xl">No devices recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {deviceSessions.map(session => (
                      <div key={session.id} className="flex items-center gap-3 rounded-xl border border-[#f1f5f9] bg-white p-3 shadow-sm">
                        <div className="w-9 h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                          {session.platform === "IOS" ? (
                            <svg className="w-4 h-4 text-[#6366f1]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>
                          ) : (
                            <svg className="w-4 h-4 text-[#6366f1]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#0f172a] truncate">{session.deviceModel}{session.osVersion ? ` · ${session.osVersion}` : ""}</p>
                          <p className="text-[11px] text-[#94a3b8] truncate">
                            {[session.location, session.lastSignIn ? new Date(session.lastSignIn.seconds * 1000).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Security ── */}
              {isPasswordUser && (
                <div>
                  <button
                    onClick={() => setShowPwForm(v => !v)}
                    className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
                  >
                    Change password
                    <svg className={`w-4 h-4 text-[#94a3b8] transition-transform duration-200 ${showPwForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                  </button>
                  {showPwForm && (
                  <div className="space-y-3 mt-3">
                    <input type="password" autoComplete="new-password" placeholder="New password (min 6 characters)" value={pwNew} onChange={e => setPwNew(e.target.value)} disabled={pwCodeSent}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-all focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10"/>
                    <input type="password" autoComplete="new-password" placeholder="Confirm new password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} disabled={pwCodeSent}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-all focus:ring-2 focus:ring-[#6366f1]/10 ${pwConfirm && pwConfirm !== pwNew ? "border-red-300 focus:border-red-400" : "border-[#e2e8f0] focus:border-[#6366f1]"}`}/>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={pwSignOutAll} onChange={e => setPwSignOutAll(e.target.checked)} className="w-4 h-4 rounded accent-[#6366f1]"/>
                      <span className="text-xs text-[#374151]">Sign out of all other devices</span>
                    </label>
                    {!pwCodeSent ? (
                      <button
                        onClick={requestPasswordCode}
                        disabled={pwSaving || pwNew.length < 6 || pwNew !== pwConfirm}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                      >
                        {pwSaving ? "Sending code…" : "Email Me a Verification Code"}
                      </button>
                    ) : (
                      <>
                        <input
                          inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code"
                          value={pwCode} onChange={e => setPwCode(e.target.value.replace(/\D/g, ""))}
                          className="w-full px-4 py-2.5 rounded-xl border border-[#c7d2fe] bg-white text-base text-center font-semibold tracking-[8px] text-[#0f172a] placeholder:tracking-normal placeholder:font-normal placeholder:text-[#94a3b8] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10"/>
                        <button
                          onClick={confirmPasswordChange}
                          disabled={pwSaving || pwCode.length !== 6}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                          {pwSaving ? "Updating…" : "Confirm & Change Password"}
                        </button>
                        <button onClick={() => { setPwCodeSent(false); setPwCode(""); setPwSuccess(""); }} disabled={pwSaving}
                          className="w-full py-1.5 text-xs font-medium text-[#6366f1] hover:text-[#4f46e5] transition-colors">
                          Didn&apos;t get it? Edit & resend
                        </button>
                      </>
                    )}
                    {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                    {pwSuccess && <p className="text-xs text-emerald-600">{pwSuccess}</p>}
                  </div>
                  )}
                </div>
              )}
              {!isPasswordUser && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-2">Password</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    You sign in with {user?.providerData[0]?.providerId === "apple.com" ? "Apple" : "Google"}, so there&apos;s no Viefolio password to change — your account is secured by your provider.
                  </p>
                </div>
              )}

              {/* ── Danger Zone ── */}
              <div className="pt-4 border-t border-[#f1f5f9]">
                <h3 className="text-xs font-semibold text-red-600 mb-1">Danger Zone</h3>
                <p className="text-[11px] text-[#94a3b8] mb-3">Permanently delete your account, portfolio, projects, and images. This cannot be undone.</p>
                <button
                  onClick={() => { setDeleteConfirmText(""); setDeleteCode(""); setDeleteCodeSent(false); setDeleteError(""); setShowDeleteModal(true); }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ─── DELETE ACCOUNT MODAL ────────────────────────── */}
      <AnimatePresence>
      {showDeleteModal && (() => {
        const confirmPhrase = profile.username || "DELETE";
        const canDelete = deleteConfirmText === confirmPhrase && !deleting;
        return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-[#e2e8f0]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
              </div>
              <h3 className="text-base font-semibold text-[#0f172a] mb-1.5">Delete your account?</h3>
              <p className="text-xs text-[#64748b] leading-relaxed mb-4">
                This permanently deletes your portfolio{profile.username ? <> at <span className="font-semibold">{profile.username}.viefolio.com</span></> : ""}, all {projects.length} project{projects.length !== 1 ? "s" : ""}, images, and your login. <span className="font-semibold text-red-600">This cannot be undone.</span>
              </p>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Type <span className="font-mono font-bold text-red-600">{confirmPhrase}</span> to confirm</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={confirmPhrase}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all mb-3"
              />
              {deleteCodeSent && (
                <>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Enter the 6-digit code we emailed you</label>
                  <input
                    inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code"
                    value={deleteCode}
                    onChange={e => setDeleteCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-white text-base text-center font-semibold tracking-[8px] text-[#0f172a] placeholder:tracking-normal placeholder:font-normal placeholder:text-[#cbd5e1] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all mb-3"
                  />
                </>
              )}
              {!deleteCodeSent && (
                <p className="text-[11px] text-[#94a3b8] mb-3">We&apos;ll email a verification code to confirm it&apos;s really you — an open session alone can&apos;t delete this account.</p>
              )}
              {deleteError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 mb-3">
                  <p className="text-xs text-red-600">{deleteError}</p>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#64748b] border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors disabled:opacity-50">Cancel</button>
                <button
                  onClick={deleteCodeSent ? deleteAccount : requestDeleteCode}
                  disabled={!canDelete || (deleteCodeSent && deleteCode.length !== 6)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? (deleteCodeSent ? "Deleting…" : "Sending code…") : (deleteCodeSent ? "Delete Forever" : "Email Me a Code")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        );
      })()}
      </AnimatePresence>
      {/* ─── EDIT MODAL ──────────────────────────────────── */}
      <AnimatePresence>
      {editingProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setEditingProject(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-[#e2e8f0]"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0f172a]">Edit Project</h3>
              <button onClick={() => setEditingProject(null)} className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] hover:text-[#475569] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Project Title</label>
                <input type="text" value={editingProject.title} onChange={e => setEditingProject({...editingProject, title: e.target.value})} placeholder="e.g. My Awesome App" className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all"/>
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Description</label>
                <textarea value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} placeholder="Describe your project…" rows={2} className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 resize-none transition-all"/>
              </div>
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Status</label>
                <div className="flex gap-2">
                  {([{v:"IN_PROGRESS",l:"In Progress"},{v:"RELEASED",l:"Completed"}] as const).map(s => (
                    <button key={s.v} onClick={() => {
                      const prev = editingProject.status;
                      const next = s.v;
                      let nextCps = editingProject.checkpoints;
                      if (prev === "IN_PROGRESS" && next === "RELEASED") {
                        backupCheckpoints.current = editingProject.checkpoints.map(c => ({...c}));
                        nextCps = editingProject.checkpoints.map(c => ({...c, isCompleted: true}));
                      } else if (prev === "RELEASED" && next === "IN_PROGRESS" && backupCheckpoints.current.length > 0) {
                        nextCps = backupCheckpoints.current.map(c => ({...c}));
                      }
                      setEditingProject({...editingProject, status: next, checkpoints: nextCps});
                    }} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${editingProject.status===s.v ? "border-[#6366f1] bg-[#eef2ff] text-[#6366f1]" : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"}`}>{s.l}</button>
                  ))}
                </div>
              </div>
              {/* Project Type */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Project Type</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    {v:"SOLO",l:"Solo"},{v:"TEAM",l:"Team"},{v:"PERSONAL",l:"Personal"},
                    {v:"FREELANCE",l:"Freelance"},{v:"CLIENT",l:"Client"},{v:"COMMISSION",l:"Commission"},
                    {v:"OPEN_SOURCE",l:"Open Source"},{v:"INTERNSHIP",l:"Internship"},{v:"ACADEMIC",l:"Academic"}
                  ] as const).map(t => (
                    <button key={t.v} onClick={() => setEditingProject({...editingProject, projectType: t.v})} className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${editingProject.projectType===t.v ? "border-[#6366f1] bg-[#eef2ff] text-[#6366f1]" : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"}`}>{t.l}</button>
                  ))}
                </div>
              </div>
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Date Range</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={editingProject.startDate} onChange={e => setEditingProject({...editingProject, startDate: e.target.value})} className="flex-1 px-3 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-xs text-[#0f172a] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all"/>
                  <span className="text-xs text-[#94a3b8]">to</span>
                  {editingProject.endDate === "present" ? (
                    <div className="flex-1 px-3 py-2.5 rounded-xl border border-[#6366f1] bg-[#eef2ff] text-xs font-semibold text-[#6366f1] text-center">Present</div>
                  ) : (
                    <input type="date" value={editingProject.endDate} onChange={e => setEditingProject({...editingProject, endDate: e.target.value})} className="flex-1 px-3 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-xs text-[#0f172a] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all"/>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setEditingProject({...editingProject, endDate: editingProject.endDate === "present" ? "" : "present"})} className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${editingProject.endDate === "present" ? "border-[#6366f1] bg-[#eef2ff] text-[#6366f1]" : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"}`}>Ongoing / Present</button>
                </div>
              </div>
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Project Image</label>
                <div className="flex items-center gap-3">
                  {editingProject.imageUrl ? (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-[#e2e8f0] group cursor-pointer" onClick={() => setEditLightbox(editingProject.imageUrl)}>
                      <img src={editingProject.imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"/>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg></div>
                    </div>
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#94a3b8]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M6.75 12.75h.008v.008H6.75v-.008z"/></svg>
                    </div>
                  )}
                  <label className={`px-3 py-2 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer transition-all ${projectImgUploading ? "opacity-50 pointer-events-none" : ""}`}>
                    {projectImgUploading ? "Uploading…" : "Upload Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProjectImage(f, editingProject.id); }}/>
                  </label>
                </div>
              </div>
              {/* Show Image + Icon Selector */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f8fafc] border border-[#f1f5f9]">
                <div><p className="text-xs font-medium text-[#374151]">Show project image</p><p className="text-[10px] text-[#94a3b8]">Display cover image on portfolio</p></div>
                <button onClick={() => setEditingProject({...editingProject, showImage: !editingProject.showImage})} className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${editingProject.showImage ? "bg-[#6366f1]" : "bg-[#d1d5db]"}`}>
                  <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${editingProject.showImage ? "translate-x-[16px]" : "translate-x-0"}`}/>
                </button>
              </div>
              {/* Icon (fallback when no image) */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Icon <span className="text-[#94a3b8] font-normal">(shown when image is hidden)</span></label>
                <div className="flex gap-2">
                  {PROJECT_ICONS.map(ic => (
                    <button key={ic.name} onClick={() => setEditingProject({...editingProject, icon: ic.name})} className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${editingProject.icon === ic.name ? "border-[#6366f1] bg-[#eef2ff] text-[#6366f1]" : "border-[#e2e8f0] text-[#94a3b8] hover:text-[#6366f1] hover:bg-[#f8fafc]"}`} title={ic.name}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={ic.icon}/></svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Tech Stack <span className="text-[#94a3b8] font-normal">(comma separated)</span></label>
                <input type="text" defaultValue={editingProject.techStack.map(t => t.technologyName).join(", ")} onBlur={e => { const names = e.target.value.split(",").map(s => s.trim()).filter(Boolean); setEditingProject({...editingProject, techStack: names.map((n, i) => ({ id: editingProject.techStack[i]?.id ?? crypto.randomUUID(), technologyName: n }))}); }} placeholder="e.g. React, Figma, Final Cut Pro, Notion" className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all"/>
              </div>
              {/* Checkpoints */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[#374151]">Checkpoints</label>
                  <button onClick={() => setEditingProject({...editingProject, checkpoints: [...editingProject.checkpoints, { id: crypto.randomUUID(), title: "", percentage: 0, isCompleted: false, orderIndex: editingProject.checkpoints.length }]})} className="text-[10px] font-semibold text-[#6366f1] hover:text-[#4f46e5]">+ Add</button>
                </div>
                <div className="space-y-2">
                  {sorted(editingProject.checkpoints).map((cp) => (
                    <div key={cp.id} className="flex items-center gap-2">
                      <button onClick={() => { const cps = editingProject.checkpoints.map(c => c.id === cp.id ? {...c, isCompleted: !c.isCompleted} : c); setEditingProject({...editingProject, checkpoints: cps}); }} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${cp.isCompleted ? "bg-[#22c55e] border-[#22c55e]" : "border-[#d1d5db] hover:border-[#6366f1]"}`}>
                        {cp.isCompleted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>}
                      </button>
                      <input type="text" value={cp.title} onChange={e => { const cps = [...editingProject.checkpoints]; const i = cps.findIndex(c => c.id === cp.id); cps[i] = {...cps[i], title: e.target.value}; setEditingProject({...editingProject, checkpoints: cps}); }} placeholder="Checkpoint title" className={`flex-1 px-3 py-2 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-[#6366f1] transition-all ${cp.isCompleted ? "line-through text-[#94a3b8]" : ""}`}/>
                      <input type="number" value={cp.percentage} onChange={e => { const cps = [...editingProject.checkpoints]; const i = cps.findIndex(c => c.id === cp.id); cps[i] = {...cps[i], percentage: Number(e.target.value)}; setEditingProject({...editingProject, checkpoints: cps}); }} className="w-16 px-2 py-2 rounded-lg border border-[#e2e8f0] text-xs text-center outline-none focus:border-[#6366f1] transition-all" min={0} max={100}/>
                      <span className="text-[10px] text-[#94a3b8]">%</span>
                      <button onClick={() => setEditingProject({...editingProject, checkpoints: editingProject.checkpoints.filter(c => c.id !== cp.id)})} className="text-[#94a3b8] hover:text-[#ef4444] transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[#374151]">Links</label>
                  <button onClick={() => setEditingProject({...editingProject, links: [...editingProject.links, { id: crypto.randomUUID(), type: "WEBSITE", url: "" }]})} className="text-[10px] font-semibold text-[#6366f1] hover:text-[#4f46e5]">+ Add</button>
                </div>
                <div className="space-y-2">
                  {editingProject.links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2">
                      <select value={link.type} onChange={e => { const ls = editingProject.links.map(l => l.id === link.id ? {...l, type: e.target.value} : l); setEditingProject({...editingProject, links: ls}); }} className="w-32 px-2 py-2 rounded-lg border border-[#e2e8f0] text-xs outline-none focus:border-[#6366f1] transition-all">
                        <option value="GITHUB">GitHub</option>
                        <option value="WEBSITE">Website</option>
                        <option value="APP_STORE">App Store</option>
                        <option value="PLAY_STORE">Play Store</option>
                        <option value="FIGMA">Figma</option>
                        <option value="BEHANCE">Behance</option>
                        <option value="DRIBBBLE">Dribbble</option>
                        <option value="YOUTUBE">YouTube</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="LINKEDIN">LinkedIn</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <input type="url" value={link.url} onChange={e => { const ls = editingProject.links.map(l => l.id === link.id ? {...l, url: e.target.value} : l); setEditingProject({...editingProject, links: ls}); }} placeholder="https://…" className="flex-1 px-3 py-2 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-[#6366f1] transition-all"/>
                      <button onClick={() => setEditingProject({...editingProject, links: editingProject.links.filter(l => l.id !== link.id)})} className="text-[#94a3b8] hover:text-[#ef4444] transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-[#f1f5f9] flex items-center justify-between">
              <button onClick={() => deleteProject(editingProject.id)} className="px-3 py-2 rounded-xl text-xs font-medium text-[#ef4444] hover:bg-red-50 transition-colors">Delete Project</button>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditingProject(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">Cancel</button>
                <motion.button
                  onClick={saveEditedProject}
                  disabled={editSaving}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-indigo-200/50"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  {editSaving ? "Saving…" : editingProject.id.startsWith("new_") ? "Create Project" : "Save Changes"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ─── Top Nav ─────────────────────────────────────── */}
      <header className="shrink-0 h-14 border-b border-[#f1f5f9] bg-white/80 backdrop-blur-xl flex items-center justify-between px-5 z-10">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Viefolio" className="w-7 h-7" />
            <span className="text-base font-semibold text-[#0f172a] tracking-tight">Viefolio</span>
          </Link>
          <span className="text-[#e2e8f0] mx-1">/</span>
          <span className="text-sm text-[#64748b] font-medium">Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          {profile.username && (
            <div className="flex items-center gap-1.5">
              <a href={`https://${profile.username}.viefolio.com`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6366f1] bg-[#eef2ff] border border-[#e0e7ff] hover:bg-[#e0e7ff] transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                <span className="hidden sm:inline">View live</span>
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://${profile.username}.viefolio.com`).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }).catch(() => {});
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors"
                title="Copy portfolio link"
              >
                {linkCopied ? (
                  <><svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg><span className="hidden sm:inline text-emerald-600">Copied!</span></>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/></svg><span className="hidden sm:inline">Copy link</span></>
                )}
              </button>
            </div>
          )}
          <span className="hidden lg:block text-xs text-[#94a3b8] truncate max-w-[180px]">{user.email}</span>
          <button onClick={handleSignOut} className="text-sm text-[#64748b] hover:text-[#ef4444] transition-colors">Sign out</button>
          <motion.button
            onClick={() => setShowAccountPanel(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#c7d2fe] transition-shadow"
            title="Account & Insights"
          >
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold">{displayName.charAt(0).toUpperCase()}</div>
            )}
          </motion.button>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ═══ LEFT COLUMN ═══════════════════════════════ */}
        <aside className="w-full md:w-[440px] lg:w-[480px] shrink-0 border-r border-[#f1f5f9] flex flex-col bg-white">
          {/* Tab Switcher */}
          <div className="shrink-0 px-5 pt-4 pb-0">
            <div className="flex gap-1 bg-[#f1f5f9] rounded-xl p-1">
              {(["profile","links","projects","skills","appearance"] as const).map(tab => (
                <button key={tab} onClick={() => switchTab(tab)} className="relative flex-1 py-2 rounded-lg text-xs font-semibold">
                  {activeTab === tab && (
                    <motion.div layoutId="tab-pill" className="absolute inset-0 bg-white rounded-lg shadow-sm" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                  <span className={`relative z-10 transition-colors duration-150 ${activeTab === tab ? "text-[#0f172a]" : "text-[#64748b]"}`}>
                    {tab==="profile" ? "Profile" : tab==="links" ? "Links" : tab==="projects" ? "Projects" : tab==="appearance" ? "Appearance" : "Skills"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-h-0 flex flex-col"
          >
          {/* ── PROFILE TAB ──────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div><h2 className="text-lg font-semibold text-[#0f172a] mb-1">Profile Settings</h2><p className="text-xs text-[#94a3b8]">Update your public portfolio information</p></div>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative group">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-indigo-200/40"/>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200/40">{displayName.charAt(0).toUpperCase()}</div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}/>
                  </label>
                  <AnimatePresence>
                    {avatarUploading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl">
                        <div className="w-5 h-5 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"/>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div><p className="text-sm font-semibold text-[#0f172a]">{displayName}</p><p className="text-xs text-[#94a3b8]">{displayTitle}</p></div>
              </div>
              {/* Show Avatar Toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f8fafc] border border-[#f1f5f9]">
                <div><p className="text-xs font-medium text-[#374151]">Show avatar on portfolio</p><p className="text-[10px] text-[#94a3b8]">Display your profile picture publicly</p></div>
                <button onClick={() => setProfile(p => ({...p, showAvatar: !p.showAvatar}))} className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${profile.showAvatar ? "bg-[#6366f1]" : "bg-[#d1d5db]"}`}>
                  <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${profile.showAvatar ? "translate-x-[16px]" : "translate-x-0"}`}/>
                </button>
              </div>
              <div className="space-y-4">
                {([
                  { key: "fullName", label: "Full Name", placeholder: "Your full name" },
                  { key: "title", label: "Professional Title", placeholder: "e.g. Software Engineer" },
                  { key: "location", label: "Location", placeholder: "e.g. San Francisco, CA" },
                ] as const).map(f => (
                  <div key={f.key}><label className="block text-xs font-medium text-[#374151] mb-1.5">{f.label}</label><input type="text" value={profile[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#cbd5e1] outline-none transition-all focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10"/></div>
                ))}
                <div><label className="block text-xs font-medium text-[#374151] mb-1.5">Bio</label><textarea value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} placeholder="Write a short bio about yourself…" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#cbd5e1] outline-none transition-all focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 resize-none"/></div>
                {/* Username / Claim URL */}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Claim your URL</label>
                  <div className={`flex items-center rounded-xl border bg-white overflow-hidden transition-all focus-within:ring-2 ${
                    usernameStatus === "taken" ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100" :
                    usernameStatus === "available" ? "border-emerald-300 focus-within:border-emerald-400 focus-within:ring-emerald-100" :
                    "border-[#e2e8f0] focus-within:border-[#6366f1] focus-within:ring-[#6366f1]/10"
                  }`}>
                    <input type="text" value={profile.username} onChange={e => { const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20); setProfile(p => ({...p, username: val})); checkUsername(val); }} placeholder="username" maxLength={20} className="flex-1 px-4 py-2.5 bg-transparent text-sm font-medium text-[#0f172a] placeholder:text-[#cbd5e1] outline-none"/>
                    <span className="pr-4 pl-1 text-sm text-[#94a3b8] select-none shrink-0">.viefolio.com</span>
                    <AnimatePresence mode="wait">
                      {usernameStatus !== "idle" && (
                        <motion.span key={usernameStatus} initial={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.15 }} className="mr-3 shrink-0 flex items-center">
                          {usernameStatus === "checking" && <svg className="w-4 h-4 text-[#94a3b8] animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                          {usernameStatus === "available" && <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>}
                          {usernameStatus === "taken" && <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Status messages */}
                  <AnimatePresence mode="wait">
                    {usernameStatus === "available" && profile.username && (
                      <motion.div key="status-available" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ type: "spring", duration: 0.25, bounce: 0 }} className="mt-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                        <p className="text-xs text-emerald-700">✓ Username is available! Your portfolio: <span className="font-semibold">{profile.username}</span>.viefolio.com</p>
                      </motion.div>
                    )}
                    {usernameStatus === "taken" && (
                      <motion.div key="status-taken" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ type: "spring", duration: 0.25, bounce: 0 }} className="mt-2 space-y-2">
                        <p className="text-xs text-red-600 font-medium">✗ Username is already taken.</p>
                        <div className="flex flex-wrap gap-1.5">
                          {usernameSuggestions.map(s => (
                            <button key={s} type="button" onClick={() => { setProfile(p => ({...p, username: s})); checkUsername(s); }} className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] text-[11px] font-medium text-[#6366f1] hover:bg-[#eef2ff] border border-[#e2e8f0] hover:border-[#c7d2fe] transition-all">
                              {s}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {usernameStatus === "idle" && profile.username && profile.username.length >= 2 && (
                      <motion.div key="status-idle" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ type: "spring", duration: 0.25, bounce: 0 }} className="mt-2 px-3 py-2 rounded-lg bg-[#f8fafc] border border-[#f1f5f9]">
                        <p className="text-xs text-[#64748b]">Your portfolio: <span className="font-semibold" style={{ color: "#6366f1" }}>{profile.username}</span>.viefolio.com</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="mt-1 text-[10px] text-[#94a3b8]">Lowercase letters, numbers, and dashes only. Max 20 characters.</p>
                </div>
              </div>
              {/* Header Layout */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Header Layout</label>
                <div className="flex gap-2">
                  {([{v:'LEFT' as const, l:'Left'},{v:'CENTER' as const, l:'Center'},{v:'RIGHT' as const, l:'Right'}]).map(o => (
                    <button key={o.v} onClick={() => setProfile(p => ({...p, userInfoLayout: o.v}))} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${profile.userInfoLayout === o.v ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>{o.l}</button>
                  ))}
                </div>
              </div>
              <motion.button
                onClick={saveProfile}
                disabled={profileSaving}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-200/50 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {profileSaving ? "Saving…" : profileSaved ? "✓ Saved!" : "Update Profile"}
              </motion.button>
            </div>
          )}

          {/* ── LINKS TAB ──────────────────────────────────── */}
          {activeTab === "links" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div><h2 className="text-lg font-semibold text-[#0f172a] mb-1">Social Links</h2><p className="text-xs text-[#94a3b8]">Manage your links and choose a layout</p></div>
                <button onClick={() => { setProfile(p => ({...p, showLinks: !(p.showLinks ?? true)})); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${profile.showLinks !== false ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#94a3b8]'}`}>
                  {profile.showLinks !== false ? 'Visible' : 'Hidden'}
                </button>
              </div>
              {/* Links Layout */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Links Layout</label>
                <div className="flex gap-2">
                  {([{v:'ICONS' as const, l:'Icons'},{v:'CARD' as const, l:'Cards'},{v:'CREATOR' as const, l:'Creator'}]).map(o => (
                    <button key={o.v} onClick={() => setProfile(p => ({...p, socialLinksLayout: o.v}))} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${profile.socialLinksLayout === o.v ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Link entries */}
              <div className="space-y-3">
                {profile.socialLinks.map((link, idx) => (
                  <div key={link.id} className="bg-white border border-[#f1f5f9] rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select value={link.type} onChange={e => setProfile(p => ({...p, socialLinks: p.socialLinks.map((l,i) => i===idx ? {...l, type: e.target.value as SocialLink['type']} : l)}))} className="px-2 py-1.5 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] outline-none">
                        <option value="GITHUB">GitHub</option>
                        <option value="LINKEDIN">LinkedIn</option>
                        <option value="TWITTER">Twitter</option>
                        <option value="X">X</option>
                        <option value="YOUTUBE">YouTube</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="TIKTOK">TikTok</option>
                        <option value="FIGMA">Figma</option>
                        <option value="BEHANCE">Behance</option>
                        <option value="DRIBBBLE">Dribbble</option>
                        <option value="WEBSITE">Website</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                      <input type="text" value={link.title} onChange={e => setProfile(p => ({...p, socialLinks: p.socialLinks.map((l,i) => i===idx ? {...l, title: e.target.value} : l)}))} placeholder="Title" className="flex-1 px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-[#6366f1] transition-all"/>
                      <button onClick={() => setProfile(p => ({...p, socialLinks: p.socialLinks.map((l,i) => i===idx ? {...l, visible: !(l.visible ?? true)} : l)}))} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors" title={link.visible !== false ? 'Visible' : 'Hidden'}>
                        <AnimatePresence mode="wait">
                        {link.visible !== false ? (
                          <motion.span key="vis" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }} className="flex"><svg className="w-4 h-4 text-[#6366f1]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></motion.span>
                        ) : (
                          <motion.span key="hid" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }} className="flex"><svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg></motion.span>
                        )}
                      </AnimatePresence>
                      </button>
                      <button onClick={() => setProfile(p => ({...p, socialLinks: p.socialLinks.filter((_,i) => i!==idx)}))} className="text-[#94a3b8] hover:text-[#ef4444] transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                    <input type="url" value={link.url} onChange={e => setProfile(p => ({...p, socialLinks: p.socialLinks.map((l,i) => i===idx ? {...l, url: e.target.value} : l)}))} placeholder="https://..." className="w-full px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-xs text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-[#6366f1] transition-all"/>
                  </div>
                ))}
              </div>
              <button onClick={() => setProfile(p => ({...p, socialLinks: [...p.socialLinks, {id: crypto.randomUUID(), type: 'CUSTOM', title: '', url: '', visible: true}]}))} className="w-full py-2.5 rounded-xl text-xs font-semibold border border-dashed border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] hover:border-[#c7d2fe] transition-all">
                + Add Link
              </button>
              <motion.button
                onClick={saveProfile}
                disabled={profileSaving}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-200/50 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {profileSaving ? 'Saving…' : profileSaved ? '✓ Saved!' : 'Save Links'}
              </motion.button>
            </div>
          )}

          {/* ── PROJECTS TAB ──────────────────────────────── */}
          {activeTab === "projects" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="shrink-0 px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div><h2 className="text-lg font-semibold text-[#0f172a]">My Projects</h2><p className="text-xs text-[#94a3b8] mt-0.5">{projects.length} project{projects.length!==1?"s":""}</p></div>
                  <button onClick={() => { setProfile(p => ({...p, showProjects: !(p.showProjects ?? true)})); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${profile.showProjects !== false ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#94a3b8]'}`}>
                    {profile.showProjects !== false ? 'Visible' : 'Hidden'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowReorder(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0] transition-all hover:bg-[#f1f5f9]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                    Reorder
                  </button>
                  <button onClick={createNewProject} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-200/50" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                    New Project
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {projects.length===0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-4"><svg className="w-7 h-7 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg></div>
                    <p className="text-sm font-medium text-[#475569] mb-1">No projects yet</p>
                    <p className="text-xs text-[#94a3b8]">Create your first project to get started</p>
                  </div>
                )}
                {projects.map(project => {
                  const isCompleted = project.status === "RELEASED";
                  return (
                    <div key={project.id} onClick={() => { setSelectedId(project.id); backupCheckpoints.current = project.checkpoints.map(c => ({...c})); setEditingProject({...project}); }} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all hover:shadow-sm ${project.visible === false ? 'opacity-60' : ''} ${selectedId === project.id ? 'border-[#c7d2fe] bg-[#fafafe] shadow-sm' : 'border-[#f1f5f9] bg-white hover:border-[#e2e8f0]'}`}>
                      {/* Image or avatar */}
                      {project.imageUrl && project.showImage ? (
                        <img src={project.imageUrl} alt={project.title} className="w-10 h-10 rounded-lg object-cover shrink-0"/>
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f1f5f9' }}>
                          <svg className="w-5 h-5 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
                        </div>
                      )}
                      {/* Title + description */}
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-semibold truncate ${project.visible === false ? 'text-[#94a3b8]' : 'text-[#0f172a]'}`}>{project.title || 'Untitled'}</h3>
                        <p className="text-xs text-[#94a3b8] mt-0.5 truncate">{project.description || 'No description'}</p>
                      </div>
                      {/* Status + visibility */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={e => { e.stopPropagation(); const updated = {...project, visible: !(project.visible ?? true)}; setProjects(ps => ps.map(p => p.id === project.id ? updated : p)); updateDoc(doc(db, 'projects', project.id), { visible: updated.visible }); }} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors" title={project.visible !== false ? 'Visible' : 'Hidden'}>
                          <AnimatePresence mode="wait">
                          {project.visible !== false ? (
                            <motion.span key="vis" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }} className="flex"><svg className="w-4 h-4 text-[#6366f1]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></motion.span>
                          ) : (
                            <motion.span key="hid" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }} className="flex"><svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg></motion.span>
                          )}
                        </AnimatePresence>
                        </button>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{isCompleted ? 'Done' : 'WIP'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Reorder Popup ── */}
              <AnimatePresence>
              {showReorder && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowReorder(false)}>
                  <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#0f172a]">Reorder Projects</h3>
                      <button onClick={() => setShowReorder(false)} className="text-[#94a3b8] hover:text-[#0f172a]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Completed */}
                      {(() => { const completed = projects.filter(p => p.status === 'RELEASED'); return completed.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">Completed ({completed.length})</p>
                          <Reorder.Group axis="y" values={completed} onReorder={(reordered) => { const inProg = projects.filter(p => p.status !== 'RELEASED'); setProjects([...reordered, ...inProg].map((p,i)=>({...p,orderIndex:i}))); setProjectOrderChanged(true); }} className="space-y-1.5">
                            {completed.map(p => (
                              <Reorder.Item key={p.id} value={p} className="cursor-grab active:cursor-grabbing">
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#f1f5f9] bg-white hover:bg-[#fafafe]">
                                  <svg className="w-4 h-4 text-[#cbd5e1] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                                  <span className="text-sm font-medium text-[#0f172a] truncate flex-1">{p.title || 'Untitled'}</span>
                                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                </div>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        </div>
                      ) : null; })()}
                      {/* In Progress */}
                      {(() => { const inProg = projects.filter(p => p.status !== 'RELEASED'); return inProg.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider mb-2">In Progress ({inProg.length})</p>
                          <Reorder.Group axis="y" values={inProg} onReorder={(reordered) => { const completed = projects.filter(p => p.status === 'RELEASED'); setProjects([...completed, ...reordered].map((p,i)=>({...p,orderIndex:i}))); setProjectOrderChanged(true); }} className="space-y-1.5">
                            {inProg.map(p => (
                              <Reorder.Item key={p.id} value={p} className="cursor-grab active:cursor-grabbing">
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#f1f5f9] bg-white hover:bg-[#fafafe]">
                                  <svg className="w-4 h-4 text-[#cbd5e1] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                                  <span className="text-sm font-medium text-[#0f172a] truncate flex-1">{p.title || 'Untitled'}</span>
                                  <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse shrink-0"/>
                                </div>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        </div>
                      ) : null; })()}
                    </div>
                    <div className="px-5 py-3 border-t border-[#f1f5f9] flex gap-2">
                      <AnimatePresence>
                        {projectOrderChanged && (
                          <motion.button
                            initial={{ opacity: 0, x: -8, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -8, scale: 0.95 }}
                            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { saveProjectOrder(); setShowReorder(false); }}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                          >
                            Save Order
                          </motion.button>
                        )}
                      </AnimatePresence>
                      <button onClick={() => setShowReorder(false)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#64748b] border border-[#e2e8f0] hover:bg-[#f8fafc]">Close</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              </AnimatePresence>
              {/* Layout Style + Portfolio Visibility */}
              <div className="shrink-0 px-5 py-4 border-t border-[#f1f5f9] space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Layout Style</label>
                  <div className="flex gap-2">
                    {LAYOUT_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => setProfile(p => ({...p, layoutStyle: o.value}))} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${profile.layoutStyle === o.value ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={o.icon}/></svg>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Portfolio Visibility</label>
                  <div className="flex gap-2">
                    {([{v:'ALL' as const, l:'All Projects'},{v:'RELEASED_ONLY' as const, l:'Released Only'}]).map(o => (
                      <button key={o.v} onClick={() => setProfile(p => ({...p, portfolioVisibility: o.v}))} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${profile.portfolioVisibility === o.v ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>{o.l}</button>
                    ))}
                  </div>
                </div>
                <motion.button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {profileSaving ? 'Saving…' : profileSaved ? '✓ Saved!' : 'Save Layout'}
                </motion.button>
              </div>
            </div>
          )}

          {/* ═══ SKILLS TAB ═══════════════════════════════ */}
          {activeTab === "skills" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#0f172a]">Your Skills</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setProfile(p => ({...p, showSkills: !(p.showSkills ?? true)})); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${profile.showSkills !== false ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#94a3b8]'}`}>
                    {profile.showSkills !== false ? 'Visible' : 'Hidden'}
                  </button>
                  <button onClick={() => setProfile(p => ({...p, skills: [...p.skills, { id: crypto.randomUUID(), name: "", level: 50, visible: true }]}))} className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5]">+ Add Skill</button>
                </div>
              </div>
              {profile.skills.length === 0 && <p className="text-xs text-[#94a3b8] text-center py-8">No skills added yet. Add your first skill!</p>}
              <div className="space-y-3">
                <Reorder.Group axis="y" values={profile.skills} onReorder={(s) => setProfile(p => ({...p, skills: s}))} className="space-y-3">
                  {profile.skills.map((skill: Skill) => (
                    <Reorder.Item key={skill.id} value={skill} className="relative cursor-grab active:cursor-grabbing w-full">
                      <div className={`border border-[#f1f5f9] rounded-xl p-4 ${skill.visible === false ? 'bg-[#fafafa]' : 'bg-white'}`}>
                        <div className="flex items-center gap-3 mb-2">
                      <input type="text" value={skill.name} onChange={e => setProfile(p => ({...p, skills: p.skills.map(s => s.id === skill.id ? {...s, name: e.target.value} : s)}))} placeholder="Skill name (e.g. React)" className="flex-1 px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#cbd5e1] outline-none focus:border-[#6366f1] transition-all"/>
                      <button onClick={() => setProfile(p => ({...p, skills: p.skills.map(s => s.id === skill.id ? {...s, visible: !(s.visible ?? true)} : s)}))} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors" title={skill.visible !== false ? 'Visible' : 'Hidden'}>
                        <AnimatePresence mode="wait">
                        {skill.visible !== false ? (
                          <motion.span key="vis" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }} className="flex"><svg className="w-4 h-4 text-[#6366f1]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></motion.span>
                        ) : (
                          <motion.span key="hid" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }} className="flex"><svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg></motion.span>
                        )}
                      </AnimatePresence>
                      </button>
                      <button onClick={() => setProfile(p => ({...p, skills: p.skills.filter(s => s.id !== skill.id)}))} className="text-[#94a3b8] hover:text-[#ef4444] transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range" min={1} max={100} value={skill.level} onChange={e => setProfile(p => ({...p, skills: p.skills.map(s => s.id === skill.id ? {...s, level: Number(e.target.value)} : s)}))} className="flex-1 h-1.5 rounded-full appearance-none bg-[#f1f5f9] accent-[#6366f1]"/>
                      <span className="text-xs font-semibold text-[#64748b] w-10 text-right">{skill.level}%</span>
                    </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
              <motion.button
                onClick={saveProfile}
                disabled={profileSaving}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-200/50 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {profileSaving ? "Saving…" : profileSaved ? "✓ Saved!" : "Save Skills"}
              </motion.button>
            </div>
          )}

          {/* ═══ APPEARANCE TAB ═══════════════════════════ */}
          {activeTab === "appearance" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div><h2 className="text-lg font-semibold text-[#0f172a] mb-1">Appearance</h2><p className="text-xs text-[#94a3b8]">Build your theme style by style</p></div>

              {/* ── Current Style ── */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-2">Current Style</label>
                {(() => {
                  const presetMeta: Record<string, {l:string;d:string;bg:string;fg:string}> = {
                    MINIMAL:{l:'Minimal',d:'Clean & light',bg:'#ffffff',fg:'#0f172a'},
                    NEON:{l:'Neon',d:'Dark & glowing',bg:'#0a0a0a',fg:'#22d3ee'},
                    GLASSMORPHISM:{l:'Glass',d:'Frosted & airy',bg:'#0f172a',fg:'#a78bfa'},
                    BRUTALIST:{l:'Brutalist',d:'Bold & raw',bg:'#fffbe6',fg:'#ff5722'},
                    SOFT:{l:'Soft',d:'Gentle & pastel',bg:'#f9f5ff',fg:'#8b5cf6'},
                    MONOCHROME:{l:'Monochrome',d:'Pure grayscale',bg:'#f8f8f8',fg:'#374151'},
                  };
                  const m = presetMeta[profile.theme.preset] ?? presetMeta.MINIMAL;
                  return (
                    <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#6366f1] bg-[#fafafe]">
                      <div className="w-16 h-12 rounded-lg flex items-center justify-center shrink-0 border border-[#e2e8f0]" style={{backgroundColor:m.bg}}>
                        <span className="text-base font-bold" style={{color:m.fg}}>Aa</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a]">{m.l}</p>
                        <p className="text-xs text-[#94a3b8]">{m.d}</p>
                      </div>
                      <button onClick={() => setShowThemeModal(true)} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e2e8f0] text-[#6366f1] bg-white hover:bg-[#eef2ff] transition-all">
                        Change Style
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* ── Theme Preset Modal ── */}
              <AnimatePresence>
              {showThemeModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                  onClick={() => setShowThemeModal(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-[#e2e8f0]"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#0f172a]">Choose a Style</h3>
                      <button onClick={() => setShowThemeModal(false)} className="w-7 h-7 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {([
                        {p:'MINIMAL' as ThemePreset,l:'Minimal',d:'Clean & light',bg:'#ffffff',fg:'#0f172a'},
                        {p:'NEON' as ThemePreset,l:'Neon',d:'Dark & electric',bg:'#0a0a0a',fg:'#22d3ee'},
                        {p:'GLASSMORPHISM' as ThemePreset,l:'Glass',d:'Frosted & airy',bg:'#0f172a',fg:'#a78bfa'},
                        {p:'BRUTALIST' as ThemePreset,l:'Brutalist',d:'Bold & raw',bg:'#fffbe6',fg:'#ff5722'},
                        {p:'SOFT' as ThemePreset,l:'Soft',d:'Gentle & pastel',bg:'#f9f5ff',fg:'#8b5cf6'},
                        {p:'MONOCHROME' as ThemePreset,l:'Monochrome',d:'Pure grayscale',bg:'#f8f8f8',fg:'#374151'},
                      ]).map(o => (
                        <button key={o.p} onClick={() => {
                          const pre = THEME_PRESETS[o.p];
                          setProfile(pr => ({...pr, theme: {...pr.theme, preset: o.p, colors: pre.colors, texture: pre.texture}}));
                          setShowThemeModal(false);
                        }} className={`p-3 rounded-xl border-2 text-left transition-all ${profile.theme.preset===o.p ? 'border-[#6366f1] shadow-md' : 'border-[#e2e8f0] hover:border-[#c7d2fe]'}`}>
                          <div className="w-full h-10 rounded-lg mb-2 flex items-center justify-center border border-[#e2e8f0]/50" style={{backgroundColor:o.bg}}>
                            <span className="text-sm font-bold" style={{color:o.fg}}>Aa</span>
                          </div>
                          <p className="text-xs font-semibold text-[#0f172a]">{o.l}</p>
                          <p className="text-[10px] text-[#94a3b8]">{o.d}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
              </AnimatePresence>

              {/* ── Custom Colors ── */}
              <div>
                <h3 className="text-xs font-semibold text-[#374151] mb-3">Custom Colors</h3>
                <div className="space-y-3">
                  {([
                    {k:'background' as const, l:'Background'},
                    {k:'card' as const, l:'Cards'},
                    {k:'accent' as const, l:'Accent'},
                    {k:'text' as const, l:'Text'},
                    {k:'descriptionColor' as const, l:'Description'},
                  ]).map(c => (
                    <div key={c.k} className="flex items-center gap-3">
                      <label className="text-xs font-medium text-[#64748b] w-20 shrink-0">{c.l}</label>
                      <div className="relative shrink-0">
                        <input
                          type="color"
                          value={profile.theme.colors[c.k].startsWith('rgba') ? '#808080' : profile.theme.colors[c.k]}
                          onChange={e => setProfile(p => ({...p, theme: {...p.theme, colors: {...p.theme.colors, [c.k]: e.target.value}}}))}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-[#e2e8f0] p-0.5"
                        />
                      </div>
                      <input
                        type="text"
                        value={profile.theme.colors[c.k]}
                        onChange={e => setProfile(p => ({...p, theme: {...p.theme, colors: {...p.theme.colors, [c.k]: e.target.value}}}))}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-mono text-[#0f172a] outline-none focus:border-[#6366f1] transition-all"
                        placeholder="#ffffff"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Font Family ── */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-2">Font Family</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    {v:'SANS' as ThemeFont, l:'Sans', sample:'Clean Aa'},
                    {v:'SERIF' as ThemeFont, l:'Serif', sample:'Elegant Aa'},
                    {v:'MONO' as ThemeFont, l:'Mono', sample:'0x1a Aa'},
                    {v:'DISPLAY' as ThemeFont, l:'Display', sample:'Grand Aa'},
                  ]).map(f => (
                    <button key={f.v} onClick={() => setProfile(p => ({...p, theme: {...p.theme, fontFamily: f.v}}))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${(profile.theme.fontFamily ?? 'SANS') === f.v ? 'border-[#6366f1] bg-[#eef2ff]' : 'border-[#e2e8f0] hover:border-[#c7d2fe]'}`}>
                      <p className="text-sm font-bold text-[#0f172a]" style={f.v === 'SERIF' ? {fontFamily:"Georgia,serif"} : f.v === 'MONO' ? {fontFamily:"monospace"} : f.v === 'DISPLAY' ? {fontFamily:"'Palatino Linotype',Palatino,serif"} : {}}>{f.sample}</p>
                      <p className="text-[10px] text-[#64748b] mt-0.5">{f.l}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Card Style ── */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-2">Card Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    {v:'FLAT' as CardStyle, l:'Flat', d:'Minimal border'},
                    {v:'SOFT_SHADOW' as CardStyle, l:'Soft Shadow', d:'Subtle depth'},
                    {v:'GLASSMORPHIC' as CardStyle, l:'Glassmorphic', d:'Frosted blur'},
                    {v:'BRUTALIST' as CardStyle, l:'Brutalist', d:'Bold offset'},
                  ]).map(cs => (
                    <button key={cs.v} onClick={() => setProfile(p => ({...p, theme: {...p.theme, cardStyle: cs.v}}))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${(profile.theme.cardStyle ?? 'FLAT') === cs.v ? 'border-[#6366f1] bg-[#eef2ff]' : 'border-[#e2e8f0] hover:border-[#c7d2fe]'}`}>
                      <p className="text-xs font-semibold text-[#0f172a]">{cs.l}</p>
                      <p className="text-[10px] text-[#94a3b8] mt-0.5">{cs.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Button Style ── */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-2">Link Button Style</label>
                <div className="flex gap-2">
                  {([
                    {v:'PILL' as ButtonStyle, l:'Pill'},
                    {v:'ROUNDED' as ButtonStyle, l:'Rounded'},
                    {v:'SHARP' as ButtonStyle, l:'Sharp'},
                    {v:'GHOST' as ButtonStyle, l:'Ghost'},
                  ]).map(bs => (
                    <button key={bs.v} onClick={() => setProfile(p => ({...p, theme: {...p.theme, buttonStyle: bs.v}}))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${(profile.theme.buttonStyle ?? 'ROUNDED') === bs.v ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>
                      {bs.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Texture Overlay ── */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-2">Texture Overlay</label>
                <div className="flex gap-2">
                  {(['NONE','DOTS','GRID','NOISE'] as ThemeTexture[]).map(t => (
                    <button key={t} onClick={() => setProfile(p => ({...p, theme: {...p.theme, texture: t}}))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${profile.theme.texture===t ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>
                      {t.charAt(0)+t.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={saveProfile}
                disabled={profileSaving}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-200/50 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {profileSaving ? 'Saving…' : profileSaved ? '✓ Saved!' : 'Save Theme'}
              </motion.button>
            </div>
          )}
          </motion.div>
          </AnimatePresence>
        </aside>

        {/* ═══ RIGHT COLUMN — LIVE PREVIEW ═══════════════ */}
        <main className="hidden md:flex flex-1 items-center justify-center bg-[#f8fafc] p-8 lg:p-12">
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"/><span className="text-xs font-medium text-[#94a3b8]">Live Preview</span></div>
              {profile.username ? (
                <a href={`https://${profile.username}.viefolio.com`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6366f1] font-mono hover:underline">{profile.username}.viefolio.com ↗</a>
              ) : (
                <span className="text-xs text-[#94a3b8] font-mono">{user.email?.split("@")[0] || "user"}.viefolio.com</span>
              )}
            </div>
            <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl shadow-black/[0.04] overflow-hidden">
              {/* Browser chrome dots */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#f1f5f9] bg-[#fafbfc]">
                <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fca5a5]"/><span className="w-2.5 h-2.5 rounded-full bg-[#fcd34d]"/><span className="w-2.5 h-2.5 rounded-full bg-[#86efac]"/></div>
                <div className="flex-1 flex justify-center"><div className="flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-[#f1f5f9] text-[10px] text-[#94a3b8] font-mono"><svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>{profile.username || user.email?.split("@")[0] || "user"}.viefolio.com</div></div>
              </div>
              {/* Preview content */}
              <div style={{backgroundColor: profile.theme.colors.background}} className="overflow-y-auto max-h-[600px]">
                <nav className="sticky top-0 z-10 backdrop-blur-md border-b px-6 h-14 flex items-center" style={{backgroundColor: `${profile.theme.colors.background}cc`, borderColor: profile.theme.preset === 'NEON' || profile.theme.preset === 'GLASSMORPHISM' ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${profile.theme.colors.accent}, ${profile.theme.colors.accent}cc)` }}>
                      <span className="text-white font-bold text-[10px]">V</span>
                    </div>
                    <span className="text-sm font-semibold" style={{color: profile.theme.colors.text}}>{profile.fullName || profile.username || "Preview"}</span>
                  </div>
                </nav>
                <div className="px-6 pb-16">
                  <PortfolioView 
                    profile={profile} 
                    projects={profile.portfolioVisibility === "RELEASED_ONLY" ? projects.filter(p => p.status === "RELEASED" || p.status === "COMPLETED") : projects} 
                    skills={profile.skills} 
                  />
                </div>
                <footer className="border-t bg-white/5" style={{borderColor: profile.theme.preset === 'NEON' || profile.theme.preset === 'GLASSMORPHISM' ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}}>
                  <div className="px-6 py-4 flex items-center justify-between">
                    <span className="text-xs text-[#94a3b8]">Powered by <span className="font-semibold" style={{ color: profile.theme.colors.accent }}>Viefolio</span></span>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* ─── Mobile Preview ──────────────────────────────── */}
      <button
        onClick={() => setShowMobilePreview(true)}
        className="md:hidden fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 px-4 py-3 rounded-full text-xs font-semibold text-white shadow-xl shadow-indigo-300/40"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        aria-label="Preview your portfolio"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Preview
      </button>
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            className="md:hidden fixed inset-0 z-[90] bg-white flex flex-col"
          >
            <div className="shrink-0 h-12 border-b border-[#f1f5f9] flex items-center justify-between px-4 bg-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"/>
                <span className="text-xs font-medium text-[#94a3b8]">Live Preview</span>
              </div>
              <button onClick={() => setShowMobilePreview(false)} className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#64748b]" aria-label="Close preview">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: profile.theme.colors.background }}>
              <div className="px-4 pb-16">
                <PortfolioView
                  profile={profile}
                  projects={profile.portfolioVisibility === "RELEASED_ONLY" ? projects.filter(p => p.status === "RELEASED" || p.status === "COMPLETED") : projects}
                  skills={profile.skills}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Onboarding Modal */}
      <AnimatePresence>{showOnboarding && user && <OnboardingModal userId={user.uid} onComplete={() => setShowOnboarding(false)} />}</AnimatePresence>
    </div>
    </MotionConfig>
  );
}
