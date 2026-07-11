
export interface DeviceSession {
  id: string;
  platform: "WEB" | "IOS" | string;
  deviceModel: string;
  osVersion?: string;
  location?: string;
  lastSignIn?: { seconds: number } | null;
}

export interface VisitStats {
  totalVisits: number;
  daily: Record<string, number>;
  lastVisitAt?: { seconds: number } | null;
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

export function dailySeries(daily: Record<string, number>, days: number) {
  const out: { key: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ key, label: d.toLocaleDateString("en", { weekday: "short" }), count: daily[key] ?? 0 });
  }
  return out;
}

export function markOwnerDevice(uid: string) {
  try { localStorage.setItem("viefolio-owner-uid", uid); } catch { /* ignore */ }
}

export async function recordWebSession(uid: string) {
  try {
    let deviceId = localStorage.getItem("viefolio-device-id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("viefolio-device-id", deviceId);
    }
    // Throttle per account — a shared key would skip recording entirely
    // when a second account signs in on the same browser
    const throttleKey = `viefolio-session-at-${uid}`;
    const last = Number(localStorage.getItem(throttleKey) ?? 0);
    if (Date.now() - last < 6 * 3600_000) return;

    let location = "";
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const j = await res.json();
        location = [j.city, j.country_name].filter(Boolean).join(", ");
      }
    } catch { /* location is best-effort */ }

    const ua = navigator.userAgent;
    const browser = ua.includes("Edg/") ? "Edge"
      : ua.includes("Chrome/") ? "Chrome"
      : ua.includes("Firefox/") ? "Firefox"
      : ua.includes("Safari/") ? "Safari" : "Browser";
    const os = /Windows/.test(ua) ? "Windows"
      : /Mac OS X/.test(ua) ? "macOS"
      : /Android/.test(ua) ? "Android"
      : /iPhone|iPad/.test(ua) ? "iOS"
      : /Linux/.test(ua) ? "Linux" : "";

    const [{ doc, setDoc, serverTimestamp }, { db }] = await Promise.all([
      import("firebase/firestore"),
      import("@/lib/db"),
    ]);
    await setDoc(doc(db, "profiles", uid, "sessions", `web-${deviceId}`), {
      platform: "WEB",
      deviceModel: [browser, os].filter(Boolean).join(" · "),
      location,
      lastSignIn: serverTimestamp(),
    }, { merge: true });
    localStorage.setItem(throttleKey, String(Date.now()));
  } catch { /* session tracking must never break the app */ }
}
