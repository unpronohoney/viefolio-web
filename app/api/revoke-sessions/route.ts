import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authz = req.headers.get("authorization") ?? "";
    const idToken = authz.startsWith("Bearer ") ? authz.slice(7) : "";
    if (!idToken) return new Response("Unauthorized", { status: 401 });

    const decoded = await adminAuth().verifyIdToken(idToken);
    const { keepSessionId } = await req.json().catch(() => ({ keepSessionId: "" }));

    await adminAuth().revokeRefreshTokens(decoded.uid);

    const sessions = await adminDb().collection(`profiles/${decoded.uid}/sessions`).get();
    if (!sessions.empty) {
      const batch = adminDb().batch();
      for (const doc of sessions.docs) {
        if (doc.id !== keepSessionId) batch.delete(doc.ref);
      }
      await batch.commit();
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("revoke-sessions route error:", err);
    return new Response("Unauthorized", { status: 401 });
  }
}
