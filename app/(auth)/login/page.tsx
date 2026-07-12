"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

const ease = [0.22, 1, 0.36, 1] as const;

// Firestore is only needed once, right after a successful sign-in — load it
// dynamically so the login page doesn't bundle the whole database SDK.
async function ensureProfile(uid: string, displayName?: string | null) {
  const [{ doc, getDoc, setDoc }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("@/lib/db"),
  ]);
  const ref = doc(db, "profiles", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { fullName: displayName || "", title: "", bio: "", location: "", username: "", avatarUrl: "", userId: uid });
  }
}

const sanitizeUsername = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);

async function checkUsernameFree(username: string): Promise<boolean> {
  const [{ doc, getDoc, getDocs, collection, query, where }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("@/lib/db"),
  ]);
  const snap = await getDoc(doc(db, "usernames", username));
  if (snap.exists()) return false;
  // Legacy fallback: profiles saved before username reservations existed
  const legacy = await getDocs(query(collection(db, "profiles"), where("username", "==", username)));
  return legacy.empty;
}

// Sign-up: claim usernames/{username} atomically and create the profile doc —
// same reservation transaction as the dashboard's saveProfile.
async function registerProfile(uid: string, fullName: string, username: string) {
  const [{ doc, getDocs, setDoc, collection, query, where, runTransaction }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("@/lib/db"),
  ]);
  if (!username) {
    await setDoc(doc(db, "profiles", uid), { fullName, title: "", bio: "", location: "", username: "", avatarUrl: "", userId: uid }, { merge: true });
    return;
  }
  const legacy = await getDocs(query(collection(db, "profiles"), where("username", "==", username)));
  if (legacy.docs.some(d => d.id !== uid)) throw new Error("USERNAME_TAKEN");
  await runTransaction(db, async (tx) => {
    const res = await tx.get(doc(db, "usernames", username));
    if (res.exists() && res.data()?.userId !== uid) throw new Error("USERNAME_TAKEN");
    tx.set(doc(db, "usernames", username), { userId: uid });
    tx.set(doc(db, "profiles", uid), { fullName, title: "", bio: "", location: "", username, avatarUrl: "", userId: uid }, { merge: true });
  });
}

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameTimer = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  function onUsernameChange(value: string) {
    const clean = sanitizeUsername(value);
    setUsername(clean);
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (clean.length < 2) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      try {
        setUsernameStatus(await checkUsernameFree(clean) ? "available" : "taken");
      } catch {
        // Read denied or offline — the sign-up transaction still enforces uniqueness
        setUsernameStatus("idle");
      }
    }, 500);
  }

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/dashboard");
    });
    return () => unsub();
  }, [router]);

  async function handleForgotPassword() {
    setError("");
    setInfo("");
    if (!email) {
      setError("Enter your email above first, then click “Forgot password?”.");
      return;
    }
    try {
      const res = await fetch("/api/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        setError(data.error ?? "Couldn't send the email. Please try again later.");
        return;
      }
      setInfo(`If an account exists for ${email}, a reset email has been sent — check your inbox and spam folder.`);
    } catch {
      setError("Couldn't send the email. Please try again later.");
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setInfo("");
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureProfile(result.user.uid, result.user.displayName);
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user") return;
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setError("");
    setInfo("");
    setAppleLoading(true);
    try {
      const result = await signInWithPopup(auth, appleProvider);
      await ensureProfile(result.user.uid, result.user.displayName);
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user") return;
      if (code === "auth/operation-not-allowed") {
        setError("Apple sign-in isn't available yet. Please use Google or email instead.");
        return;
      }
      if (code === "auth/account-exists-with-different-credential") {
        setError("This email is registered with a different sign-in method.");
        return;
      }
      setError("Apple sign-in failed. Please try again.");
    } finally {
      setAppleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (isSignUp) {
      if (password !== confirmPassword) { setError("Passwords don't match."); return; }
      if (!fullName.trim()) { setError("Please enter your name."); return; }
      if (username.length < 2) { setError("Username must be at least 2 characters."); return; }
      if (usernameStatus === "taken") { setError(`"${username}" is already taken — try ${username}-dev or ${username}hq.`); return; }
      if (!acceptTerms) { setError("Please accept the Terms of Service and Privacy Policy."); return; }
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: fullName.trim() }).catch(() => {});
        try {
          await registerProfile(result.user.uid, fullName.trim(), username);
        } catch (err: unknown) {
          if (err instanceof Error && err.message === "USERNAME_TAKEN") {
            // Account exists; profile is created without a username so the
            // dashboard can offer a new one.
            await registerProfile(result.user.uid, fullName.trim(), "");
          } else {
            throw err;
          }
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await ensureProfile(result.user.uid, result.user.displayName);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const messages: Record<string, string> = {
        "auth/invalid-credential": "Invalid email or password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };
      setError(messages[code] || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-8">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-20 h-20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Viefolio" className="w-20 h-20" />
            </motion.div>
            <span className="text-3xl font-semibold text-[#0f172a] tracking-tight">Viefolio</span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease, delay: 0.08 }}
          className="bg-white rounded-2xl shadow-xl shadow-black/[0.04] border border-[#f1f5f9] p-8 md:p-10"
        >
          {/* Heading — animate on mode switch */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isSignUp ? "signup-heading" : "signin-heading"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease }}
              className="text-center mb-8"
            >
              <h1 className="text-2xl font-bold text-[#0f172a] mb-2">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-sm text-[#64748b]">
                {isSignUp ? "Start building your living portfolio" : "Sign in to continue to your dashboard"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Google Button */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            whileHover={{ scale: 1.015, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] text-sm font-semibold transition-colors duration-150 hover:bg-[#f8fafc] hover:border-[#cbd5e1] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <svg className="w-5 h-5 animate-spin text-[#94a3b8]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? "Signing in…" : "Continue with Google"}
          </motion.button>

          {/* Apple Button */}
          <motion.button
            type="button"
            onClick={handleAppleSignIn}
            disabled={appleLoading}
            whileHover={{ scale: 1.015, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-black text-white text-sm font-semibold mt-3 transition-colors duration-150 hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {appleLoading ? (
              <svg className="w-5 h-5 animate-spin text-white/60" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            )}
            {appleLoading ? "Signing in…" : "Continue with Apple"}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#e2e8f0]" />
            <span className="text-xs text-[#94a3b8] font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-[#e2e8f0]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sign-up only: name + username */}
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-[#374151] mb-1.5">Full Name</label>
                    <input id="fullName" type="text" autoComplete="name" required={isSignUp} value={fullName}
                      onChange={e => setFullName(e.target.value)} placeholder="Your name"
                      className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] outline-none transition-all duration-200 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10"/>
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-[#374151] mb-1.5">Username</label>
                    <div className="relative">
                      <input id="username" type="text" autoComplete="off" required={isSignUp} value={username}
                        onChange={e => onUsernameChange(e.target.value)} placeholder="username"
                        className={`w-full px-4 py-3 pr-10 rounded-xl border bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6366f1]/10 ${usernameStatus === "taken" ? "border-red-300 focus:border-red-400" : "border-[#e2e8f0] focus:border-[#6366f1]"}`}/>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === "checking" && (
                          <svg className="w-4 h-4 animate-spin text-[#94a3b8]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        )}
                        {usernameStatus === "available" && (
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        )}
                        {usernameStatus === "taken" && (
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        )}
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 ${usernameStatus === "taken" ? "text-red-500" : "text-[#94a3b8]"}`}>
                      {usernameStatus === "taken"
                        ? `"${username}" is taken — try ${username}-dev or ${username}hq`
                        : `${username || "yourname"}.viefolio.com`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease, delay: 0.18 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
              <input id="email" type="email" autoComplete="email" required value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] outline-none transition-all duration-200 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10"/>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease, delay: 0.24 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[#374151]">Password</label>
                {!isSignUp && (
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-[#6366f1] hover:text-[#4f46e5] transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <input id="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"}
                required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] outline-none transition-all duration-200 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10"/>
            </motion.div>

            {/* Sign-up only: confirm password */}
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div
                  key="confirm-password"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease }}
                  className="overflow-hidden"
                >
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#374151] mb-1.5">Confirm Password</label>
                  <input id="confirmPassword" type="password" autoComplete="new-password"
                    required={isSignUp} minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6366f1]/10 ${confirmPassword && confirmPassword !== password ? "border-red-300 focus:border-red-400" : "border-[#e2e8f0] focus:border-[#6366f1]"}`}/>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs mt-1.5 text-red-500">Passwords don&apos;t match</p>
                  )}
                  <label className="flex items-start gap-2.5 mt-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={e => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded accent-[#6366f1] shrink-0"
                    />
                    <span className="text-xs text-[#64748b] leading-relaxed">
                      I agree to Viefolio&apos;s{" "}
                      <a href="/terms" target="_blank" className="font-semibold text-[#6366f1] hover:text-[#4f46e5] underline">Terms of Service</a>{" "}
                      and{" "}
                      <a href="/privacy" target="_blank" className="font-semibold text-[#6366f1] hover:text-[#4f46e5] underline">Privacy Policy</a>.
                    </span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info (e.g. password reset sent) */}
            <AnimatePresence>
              {info && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.22, ease }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-sm text-emerald-700">{info}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.22, ease }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || (isSignUp && (usernameStatus === "checking" || usernameStatus === "taken" || (!!confirmPassword && confirmPassword !== password) || !acceptTerms))}
              whileHover={{ scale: 1.015, boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease, delay: 0.3 } }}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {isSignUp ? "Creating account…" : "Signing in…"}
                </span>
              ) : isSignUp ? "Create Account" : "Sign In"}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748b]">
              {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
              <motion.button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(""); setInfo(""); setConfirmPassword(""); setAcceptTerms(false); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="font-semibold text-[#6366f1] hover:text-[#4f46e5] transition-colors"
              >
                {isSignUp ? "Sign in" : "Create one"}
              </motion.button>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease, delay: 0.5 }}
          className="text-center text-xs text-[#94a3b8] mt-6"
        >
          By continuing, you agree to Viefolio&apos;s{" "}
          <a href="/terms" className="underline hover:text-[#64748b] transition-colors">Terms</a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-[#64748b] transition-colors">Privacy Policy</a>.
        </motion.p>
      </div>
    </div>
    </MotionConfig>
  );
}
