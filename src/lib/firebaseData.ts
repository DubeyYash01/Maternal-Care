import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  onSnapshot as onDocSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebaseCore";

export type PredictionDoc = {
  id: string;
  windowDocId: string;
  patientId: string;
  windowStartTs?: string;
  windowEndTs?: string;
  predictedStatus: string;
  criticalProb: number;
  moderateProb: number;
  bestProb: number;
  modelVersion?: string;
  createdAt?: string;
};

// ---- PREDICTIONS ----
// Listens to the latest prediction (ordered by createdAt)
export function subscribeLatestPrediction(
  cb: (pred: PredictionDoc | null) => void
): () => void {
  // If your collection is named differently (e.g. "Prediction"), change "predictions" here.
  const q = query(
    collection(db, "predictions"),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  console.log("[subscribeLatestPrediction] setting up listener");

  return onSnapshot(
    q,
    (snap) => {
      console.log("[subscribeLatestPrediction] snapshot size:", snap.size);
      if (snap.empty) {
        cb(null);
        return;
      }
      const d = snap.docs[0];
      const data = d.data() as Omit<PredictionDoc, "id">;
      console.log("[subscribeLatestPrediction] first doc:", d.id, data);
      cb({ id: d.id, ...data });
    },
    (error) => {
      console.error("[subscribeLatestPrediction] error:", error);
      cb(null);
    }
  );
}

// One-off debug helper to list all prediction docs
export async function debugListPredictions() {
  const snaps = await getDocs(collection(db, "predictions"));
  console.log("[debugListPredictions] total docs:", snaps.size);
  snaps.forEach((d) => console.log("  doc:", d.id, d.data()));
}

// ---- SENSOR SNAPSHOT ----
// Adjust this path if your Sensor_data doc is stored somewhere else.
export function subscribeCurrentSensorData(
  cb: (data: any | null) => void
): () => void {
  // Example assumes collection "Sensor_data" and doc "current".
  const ref = doc(db, "Sensor_data", "current");

  console.log("[subscribeCurrentSensorData] setting up listener");

  return onDocSnapshot(
    ref,
    (snap) => {
      const data = snap.exists() ? snap.data() : null;
      console.log("[subscribeCurrentSensorData] data:", data);
      cb(data);
    },
    (error) => {
      console.error("[subscribeCurrentSensorData] error:", error);
      cb(null);
    }
  );
}

// ---- SENSOR LOG WINDOWS ----
// Subscribes to the last N sensor_logs_10s windows.
export function subscribeRecentSensorLogs(
  limitN: number,
  cb: (logs: any[]) => void
): () => void {
  // If your collection is named differently, change "sensor_logs_10s" here.
  const q = query(
    collection(db, "sensor_logs_10s"),
    orderBy("windowEndTs", "desc"),
    limit(limitN)
  );

  console.log("[subscribeRecentSensorLogs] setting up listener");

  return onSnapshot(
    q,
    (snap) => {
      console.log("[subscribeRecentSensorLogs] snapshot size:", snap.size);
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("[subscribeRecentSensorLogs] docs:", logs);
      cb(logs);
    },
    (error) => {
      console.error("[subscribeRecentSensorLogs] error:", error);
      cb([]);
    }
  );
}