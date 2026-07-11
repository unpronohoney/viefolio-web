import { createHash } from "crypto";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";

export const runtime = "nodejs";

// Full account wipe, gated behind an emailed verification code so an open
// session alone can never destroy an account. Used by the iOS app; the web
// dashboard has its own reauth-based flow.
export async function POST(req: Request) {
  try {
    const authz = req.headers.get("authorization") ?? "";
    const idToken = authz.startsWith("Bearer ") ? authz.slice(7) : "";
    if (!idToken) return new Response("Unauthorized", { status: 401 });
    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const { code } = await req.json();
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return Response.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }

    const ref = adminDb().doc(`passwordOtps/${uid}`);
    const snap = await ref.get();
    const otp = snap.data();
    if (!snap.exists || !otp || otp.purpose !== "DELETE_ACCOUNT") {
      return Response.json({ error: "No deletion code requested. Send a new one." }, { status: 400 });
    }
    if (otp.expiresAt.toMillis() < Date.now() || otp.attempts >= 5) {
      await ref.delete();
      return Response.json({ error: "That code expired. Send a new one." }, { status: 400 });
    }
    const codeHash = createHash("sha256").update(`${uid}:${code}`).digest("hex");
    if (codeHash !== otp.codeHash) {
      await ref.update({ attempts: (otp.attempts ?? 0) + 1 });
      return Response.json({ error: "Wrong code. Check your email and try again." }, { status: 400 });
    }
    await ref.delete();

    const db = adminDb();

    const projects = await db.collection("projects").where("userId", "==", uid).get();
    const usernames = await db.collection("usernames").where("userId", "==", uid).get();
    const sessions = await db.collection(`profiles/${uid}/sessions`).get();
    const batch = db.batch();
    projects.docs.forEach(d => batch.delete(d.ref));
    usernames.docs.forEach(d => batch.delete(d.ref));
    sessions.docs.forEach(d => batch.delete(d.ref));
    batch.delete(db.doc(`profiles/${uid}`));
    batch.delete(db.doc(`stats/${uid}`));
    await batch.commit();

    const bucket = getStorage().bucket("portfolio-df758.firebasestorage.app");
    await Promise.allSettled([
      bucket.deleteFiles({ prefix: `profiles/${uid}/` }),
      bucket.deleteFiles({ prefix: `project-images/${uid}/` }),
      ...projects.docs.map(d => bucket.deleteFiles({ prefix: `projects/${d.id}/` })),
    ]);

    await adminAuth().deleteUser(uid);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response("Unauthorized", { status: 401 });
  }
}
