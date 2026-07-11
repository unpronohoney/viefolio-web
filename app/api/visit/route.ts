import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const RATE_WINDOW_MS = 30 * 60_000;
const recentVisits = new Map<string, number>();

function throttled(key: string): boolean {
  const now = Date.now();
  const last = recentVisits.get(key) ?? 0;
  if (now - last < RATE_WINDOW_MS) return true;
  if (recentVisits.size > 5000) {
    for (const [k, t] of recentVisits) {
      if (now - t > RATE_WINDOW_MS) recentVisits.delete(k);
    }
  }
  recentVisits.set(key, now);
  return false;
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== "string" || !uid || uid.length > 128) {
      return new Response("Bad request", { status: 400 });
    }

    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (throttled(`${ip}|${uid}`)) return Response.json({ counted: false });

    const profile = await adminDb().doc(`profiles/${uid}`).get();
    if (!profile.exists) return new Response("Unknown portfolio", { status: 404 });

    const today = new Date().toISOString().slice(0, 10);
    await adminDb().doc(`stats/${uid}`).set({
      totalVisits: FieldValue.increment(1),
      daily: { [today]: FieldValue.increment(1) },
      lastVisitAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return Response.json({ counted: true });
  } catch (err) {
    console.error("visit route error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
