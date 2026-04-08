type Sample = {
  ts_ms?: string;
  Sensor_data?: {
    AD8232?: { ecgHrBpm?: number; ecgAdc?: number; ecgLeadsOff?: number; ecgMappedmV?: number };
    FSR?: { fsrAU?: number; fsrAdc?: number };
    INMP441?: { micLevel?: number; respBpm?: number };
    MAX30105?: { maxSpO2?: number; maxHrBpm?: number };
    TMP117?: { tempC?: number; online?: number };
  };
};

type WindowDoc = {
  id: string;
  windowStartTs?: string;
  windowEndTs?: string;
  samples?: Sample[];
};

function SensorRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between text-[11px] text-gray-700">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value ?? "–"}</span>
    </div>
  );
}

function SampleCard({ s }: { s: Sample }) {
  const sd = s.Sensor_data ?? {};
  const ad = sd.AD8232 ?? {};
  const fsr = sd.FSR ?? {};
  const mic = sd.INMP441 ?? {};
  const max = sd.MAX30105 ?? {};
  const tmp = sd.TMP117 ?? {};

  return (
    <div className="rounded border border-gray-100 bg-gray-50 p-2">
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
        <span className="font-mono">{s.ts_ms ?? "ts"}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded bg-white p-2 border border-gray-100">
          <div className="text-[11px] font-semibold text-gray-700 mb-1">AD8232 (ECG)</div>
          <SensorRow label="ecgHrBpm" value={ad.ecgHrBpm} />
          <SensorRow label="ecgAdc" value={ad.ecgAdc} />
          <SensorRow label="ecgLeadsOff" value={ad.ecgLeadsOff} />
          <SensorRow label="ecgMappedmV" value={ad.ecgMappedmV} />
        </div>

        <div className="rounded bg-white p-2 border border-gray-100">
          <div className="text-[11px] font-semibold text-gray-700 mb-1">FSR (Pressure)</div>
          <SensorRow label="fsrAU" value={fsr.fsrAU} />
          <SensorRow label="fsrAdc" value={fsr.fsrAdc} />
        </div>

        <div className="rounded bg-white p-2 border border-gray-100">
          <div className="text-[11px] font-semibold text-gray-700 mb-1">INMP441 (Mic/Resp)</div>
          <SensorRow label="micLevel" value={mic.micLevel} />
          <SensorRow label="respBpm" value={mic.respBpm} />
        </div>

        <div className="rounded bg-white p-2 border border-gray-100">
          <div className="text-[11px] font-semibold text-gray-700 mb-1">MAX30105 (SpO₂/HR)</div>
          <SensorRow label="maxSpO2" value={max.maxSpO2} />
          <SensorRow label="maxHrBpm" value={max.maxHrBpm} />
        </div>

        <div className="rounded bg-white p-2 border border-gray-100">
          <div className="text-[11px] font-semibold text-gray-700 mb-1">TMP117 (Temp)</div>
          <SensorRow label="tempC" value={tmp.tempC} />
          <SensorRow label="online" value={tmp.online} />
        </div>
      </div>
    </div>
  );
}

export function WindowAccordion({ logs }: { logs: WindowDoc[] }) {
  if (!logs.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        No windows found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log, idx) => (
        <details
          key={log.id}
          open={idx === 0}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">Window {log.id}</div>
              <div className="text-xs text-gray-500">
                {log.windowStartTs ?? "?"} → {log.windowEndTs ?? "?"}
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Samples: {log.samples?.length ?? 0}
            </div>
          </summary>

          <div className="mt-3 space-y-2 text-xs text-gray-700">
            {(log.samples ?? []).slice(0, 3).map((s, i) => (
              <SampleCard key={i} s={s} />
            ))}

            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600">View raw JSON</summary>
              <pre className="mt-1 max-h-64 overflow-auto rounded bg-gray-900 p-2 text-[11px] text-gray-100">
{JSON.stringify(log, null, 2)}
              </pre>
            </details>
          </div>
        </details>
      ))}
    </div>
  );
}

export default WindowAccordion;