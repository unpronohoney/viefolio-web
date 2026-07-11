import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import app from "@/lib/firebase";

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
