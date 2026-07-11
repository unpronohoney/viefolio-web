/* Firebase app + auth only. Firestore lives in lib/db.ts and Storage in
   lib/storage.ts so pages that only authenticate (e.g. /login) don't bundle
   the much larger database/storage SDKs. */
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrKHv5rOhgxTbyQkpnzeAiljLFxWELXuo",
  authDomain: "portfolio-df758.firebaseapp.com",
  projectId: "portfolio-df758",
  storageBucket: "portfolio-df758.firebasestorage.app",
  messagingSenderId: "678600493393",
  appId: "1:678600493393:web:2505d0cb5fa59d9d976b70",
  measurementId: "G-G0EN29S769",
};

// Prevent re-initialization in dev (hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export default app;
