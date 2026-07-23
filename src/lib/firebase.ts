import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Task } from "../types";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance using databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface SyncData {
  inboxTasks: Task[];
  todayTasks: Task[];
  updatedAt: string;
}

/**
 * Subscribe to real-time sync for a given sync key (e.g., 'main_planner')
 */
export function subscribeToSync(
  syncKey: string,
  onData: (data: SyncData) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, "planners", syncKey);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SyncData;
        onData({
          inboxTasks: data.inboxTasks || [],
          todayTasks: data.todayTasks || [],
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      }
    },
    (err) => {
      console.error("Firestore sync error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save current tasks to cloud Firestore
 */
export async function saveToCloud(syncKey: string, inboxTasks: Task[], todayTasks: Task[]) {
  try {
    const docRef = doc(db, "planners", syncKey);
    await setDoc(
      docRef,
      {
        inboxTasks,
        todayTasks,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to save tasks to cloud:", err);
  }
}
