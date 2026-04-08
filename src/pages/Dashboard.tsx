import { useEffect, useState } from "react";
import {
  subscribeCurrentSensorData,
  subscribeLatestPrediction,
  subscribeRecentSensorLogs,
  debugListPredictions,
  PredictionDoc,
} from "../lib/firebaseData";
import { CurrentVitalsCard } from "../components/CurrentVitalsCard";
import { PredictionCard } from "../components/PredictionCard";
import { WindowAccordion } from "../components/WindowAccordion";

type SensorData = any; // keep as-is; your hook already returns a shape

export function DashboardPage() {
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<PredictionDoc | null>(null);

  useEffect(() => {
    (async () => {
      await debugListPredictions(); // optional debug
    })();

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
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-xl font-bold text-gray-800">Maternal Care Pipeline</h1>

        {/* Top cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-semibold text-gray-700">
              Step 1: Live Sensor Snapshot (from Firebase)
            </div>
            {sensor ? (
              <CurrentVitalsCard data={sensor} />
            ) : (
              <p className="text-sm text-gray-500">
                No live sensor data (Sensor_data/current not found).
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-semibold text-gray-700">
              Step 3: Model Output (CTU-CHB Inference)
            </div>
            <PredictionCard prediction={prediction} />
          </div>
        </div>

        {/* Historical windows */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-gray-700">
            Step 2: Historical Windows (sensor_logs_10s)
          </div>
          <WindowAccordion logs={logs} />
        </div>

        {/* Pipeline explainer */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
          <div className="font-semibold text-gray-800 mb-1">Step 4: How the Pipeline Works</div>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Sensors (ECG, FSR, Resp, SpO₂) send data to Firebase.</li>
            <li>Data is stored as 10-second windows in <code>sensor_logs_10s</code>.</li>
            <li>The backend notebook/script reads the latest window, maps to CTU‑CHB inputs, fills missing clinical medians, and runs the pretrained model.</li>
            <li>The prediction is written to <code>predictions</code> and displayed here in real time.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;