type SensorData = {
  AD8232?: { ecgHrBpm?: number; ecgLeadsOff?: number };
  FSR?: { fsrAU?: number };
  INMP441?: { respBpm?: number };
  MAX30105?: { maxHrBpm?: number; maxSpO2?: number; ts_ms?: any };
};

export function CurrentVitalsCard({ data }: { data: SensorData | null }) {
  if (!data) {
    return (
      <p className="text-sm text-gray-500">
        No live sensor data (Sensor_data/current not found).
      </p>
    );
  }

  const hr =
    data.AD8232?.ecgHrBpm ??
    data.MAX30105?.maxHrBpm ??
    0;
  const resp = data.INMP441?.respBpm ?? 0;
  const spo2 = data.MAX30105?.maxSpO2 ?? 0;
  const fsr = data.FSR?.fsrAU ?? 0;

  return (
    <div className="space-y-1">
      <p>
        Heart Rate: <strong>{hr}</strong> bpm
      </p>
      <p>
        Respiration: <strong>{resp}</strong> bpm
      </p>
      <p>
        SpO₂: <strong>{spo2}</strong> %
      </p>
      <p>
        FSR (pressure proxy): <strong>{fsr}</strong>
      </p>
    </div>
  );
}