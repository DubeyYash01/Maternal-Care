import type { PredictionDoc } from "../lib/firebaseData";

const statusColor: Record<string, string> = {
  "critical (0-3)": "bg-red-100 text-red-800 border-red-200",
  "moderate (4-6)": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "best (7-10)": "bg-green-100 text-green-800 border-green-200",
};

export function PredictionCard({ prediction }: { prediction: PredictionDoc | null }) {
  if (!prediction) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        No predictions yet. Run the backend inference notebook.
      </div>
    );
  }

  const pillClass =
    statusColor[prediction.predictedStatus] ??
    "bg-blue-100 text-blue-800 border-blue-200";

  const probs = [
    { label: "Critical", value: prediction.criticalProb || 0, color: "bg-red-500" },
    { label: "Moderate", value: prediction.moderateProb || 0, color: "bg-amber-500" },
    { label: "Best", value: prediction.bestProb || 0, color: "bg-green-500" },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">Model Output</div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${pillClass}`}>
          {prediction.predictedStatus}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {probs.map((p) => (
          <div key={p.label} className="text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{p.label}</span>
              <span>{(p.value * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
              <div
                className={`${p.color} h-2`}
                style={{ width: `${Math.min(100, Math.max(0, p.value * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500 space-y-1">
        {prediction.windowStartTs && prediction.windowEndTs && (
          <div>
            Window: {prediction.windowStartTs} → {prediction.windowEndTs}
          </div>
        )}
        {prediction.modelVersion && <div>Model: {prediction.modelVersion}</div>}
        {prediction.createdAt && <div>Generated: {prediction.createdAt}</div>}
      </div>
    </div>
  );
}