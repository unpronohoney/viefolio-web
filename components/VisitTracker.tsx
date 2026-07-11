"use client";

import { useEffect } from "react";

export default function VisitTracker({ ownerUid }: { ownerUid: string }) {
  useEffect(() => {
    if (!ownerUid) return;
    let cancelled = false;
    (async () => {
      try {
        const sessionKey = `viefolio-visited-${ownerUid}`;
        if (sessionStorage.getItem(sessionKey)) return;
        // never count the owner's own devices
        if (localStorage.getItem("viefolio-owner-uid") === ownerUid) return;

        const [{ onAuthStateChanged }, { auth }] = await Promise.all([
          import("firebase/auth"),
          import("@/lib/firebase"),
        ]);
        const visitorUid = await new Promise<string | null>((resolve) => {
          const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u?.uid ?? null); });
        });
        if (cancelled || visitorUid === ownerUid) return;

        const res = await fetch("/api/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: ownerUid }),
        });
        if (res.ok) sessionStorage.setItem(sessionKey, "1");
      } catch { /* analytics must never break the portfolio page */ }
    })();
    return () => { cancelled = true; };
  }, [ownerUid]);

  return null;
}
