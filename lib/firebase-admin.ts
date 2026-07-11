import "server-only";
import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Accepts the service account as raw JSON or base64-encoded JSON — base64
// survives .env quoting and Vercel's env editor without any escaping issues.
function parseServiceAccount(raw: string) {
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    return JSON.parse(Buffer.from(trimmed, "base64").toString("utf8"));
  }
}

function app(): App {
  const existing = getApps();
  if (existing.length) return existing[0];
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  return initializeApp({
    credential: sa ? cert(parseServiceAccount(sa)) : applicationDefault(),
    projectId: "portfolio-df758",
  });
}

export const adminDb = () => getFirestore(app());
export const adminAuth = () => getAuth(app());
