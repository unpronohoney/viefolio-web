"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";

/* Custom handler for Firebase password-reset links (set as the Action URL in
 * Authentication → Templates). Verifies the code up front so users see the
 * real reason when a link is stale, instead of a generic error page. */

function ResetForm() {
  const params = useSearchParams();
  const oobCode = params.get("oobCode") ?? "";

  const [state, setState] = useState<"checking" | "ready" | "done" | "bad-link">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!oobCode) { setState("bad-link"); setError("This link is incomplete — open it directly from the email."); return; }
    verifyPasswordResetCode(auth, oobCode)
      .then((mail) => { setEmail(mail); setState("ready"); })
      .catch((err: { code?: string }) => {
        setState("bad-link");
        setError(err.code === "auth/expired-action-code"
          ? "This link has expired. Request a new one from the sign-in page."
          : "This link was already used or replaced by a newer email. Only the most recent reset email works — request a fresh one.");
      });
  }, [oobCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setSaving(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setState("done");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/expired-action-code") setError("This link expired while the page was open. Request a new one.");
      else if (code === "auth/weak-password") setError("Password must be at least 6 characters.");
      else setError("Couldn't reset the password. Request a new link and try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] outline-none transition-all duration-200 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-16">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Viefolio" className="w-10 h-10" />
            <span className="text-2xl font-semibold text-[#0f172a] tracking-tight">Viefolio</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-black/[0.04] border border-[#f1f5f9] p-8 md:p-10">
          {state === "checking" && (
            <p className="text-sm text-[#64748b] text-center py-6">Checking your link…</p>
          )}

          {state === "bad-link" && (
            <div className="text-center py-2">
              <h1 className="text-xl font-bold text-[#0f172a] mb-2">Link not valid</h1>
              <p className="text-sm text-[#64748b] mb-6">{error}</p>
              <Link href="/login" className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Back to Sign In
              </Link>
            </div>
          )}

          {state === "ready" && (
            <>
              <h1 className="text-xl font-bold text-[#0f172a] mb-1 text-center">Set a new password</h1>
              <p className="text-sm text-[#64748b] mb-6 text-center">for <span className="font-semibold">{email}</span></p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" autoComplete="new-password" required minLength={6} placeholder="New password (min 6 characters)"
                  value={password} onChange={e => setPassword(e.target.value)} className={inputCls}/>
                <input type="password" autoComplete="new-password" required placeholder="Confirm new password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} className={inputCls}/>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button type="submit" disabled={saving}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  {saving ? "Saving…" : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {state === "done" && (
            <div className="text-center py-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              </div>
              <h1 className="text-xl font-bold text-[#0f172a] mb-2">Password reset</h1>
              <p className="text-sm text-[#64748b] mb-6">You can sign in with your new password now.</p>
              <Link href="/login" className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
