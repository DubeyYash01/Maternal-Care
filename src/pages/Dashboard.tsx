import { useEffect, useState } from "react";
import {
  subscribeCurrentSensorData,
  subscribeLatestPrediction,
  subscribeRecentSensorLogs,
  debugListPredictions,
} from "../lib/firebaseData";
import { CurrentVitalsCard } from "../components/CurrentVitalsCard";
import { PredictionCard } from "../components/PredictionCard";
import type { PredictionDoc } from "../lib/firebaseData";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../lib/firebaseCore";

const Dashboard = () => {
  const [sensor, setSensor] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<PredictionDoc | null>(null);

  useEffect(() => {
    (async () => {
      const preds = await getDocs(collection(db, "predictions"));
      console.log("[DEBUG] predictions docs size:", preds.size);
      preds.forEach(d => console.log("[DEBUG] pred doc", d.id, d.data()));

      const logs = await getDocs(collection(db, "sensor_logs_10s"));
      console.log("[DEBUG] sensor_logs_10s docs size:", logs.size);
      logs.forEach(d => console.log("[DEBUG] log doc", d.id, d.data()));
    })();
    // one-off debug to see what's in the predictions collection
    debugListPredictions();

    const unsubSensor = subscribeCurrentSensorData(setSensor);
    const unsubLogs = subscribeRecentSensorLogs(5, setLogs);
    const unsubPred = subscribeLatestPrediction(setPrediction);

    return () => {
      unsubSensor();
      unsubLogs();
      unsubPred();
    };
  }, []);

  return (
    <div className="p-4 space-y-6">
      <section className="border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-2">
          Step 1: Live Sensor Snapshot (from Firebase)
        </h2>
        <CurrentVitalsCard data={sensor} />
      </section>

      <section className="border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-2">
          Step 2: Historical Windows (sensor_logs_10s)
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          Showing the last few 10-second windows exactly as stored in Firestore.
        </p>
        <pre className="text-xs bg-gray-900 text-gray-100 rounded p-2 max-h-64 overflow-auto">
          {logs.length ? JSON.stringify(logs, null, 2) : "No logs yet."}
        </pre>
      </section>

      <section className="border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-2">
          Step 3: Model Output (CTU‑CHB Inference)
        </h2>
        <PredictionCard prediction={prediction} />
      </section>

      <section className="border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-2">
          Step 4: How the Pipeline Works
        </h2>
        <p className="text-sm text-gray-700">
          The pregnancy belt sends ECG, FSR, respiration, and SpO₂ signals to
          Firebase. These are stored as 10-second windows in the{" "}
          <code>sensor_logs_10s</code> collection. A backend Python script
          (running the same code as our Jupyter notebook) downloads the latest
          window, maps its sensor values to the CTU‑CHB clinical model inputs,
          fills missing clinical parameters with median values from the training
          dataset, and runs a pretrained neural network to estimate fetal
          status. The prediction (class label and confidence scores) is written
          back into the <code>predictions</code> collection, which this page
          subscribes to in real time.
        </p>
      </section>
    </div>
  );
};

export default Dashboard;