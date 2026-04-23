import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";

import { database } from "@/lib/firebase";

type SensorData = {
  maxHrBpm: number | null;
  maxSpO2: number | null;
  tempC: number | null;
  respBpm: number | null;
  ecgMappedmV: number | null;
  ecgAdc: number | null;
  fsrAU: number | null;
  micLevel: number | null;
  onLine: number | null;
  ecgLeadsOff: number | null;
};

type HistoryEntry = {
  time: string;
  value: number;
};

type SensorHistory = {
  heartRate: HistoryEntry[];
  temperature: HistoryEntry[];
  spo2: HistoryEntry[];
  respiration: HistoryEntry[];
  ecg: HistoryEntry[];
  pressure: HistoryEntry[];
  mic: HistoryEntry[];
};

const CHART_HISTORY_LENGTH = 20;

const FIREBASE_PATHS = {
  maxHrBpm: "Sensor_data/MAX30105/maxHrBpm",
  maxSpO2: "Sensor_data/MAX30105/maxSpO2",
  tempC: "Sensor_data/TMP117/tempC",
  respBpm: "Sensor_data/INMP441/respBpm",
  ecgMappedmV: "Sensor_data/ADB232/ecgMappedmV",
  ecgAdc: "Sensor_data/ADB232/ecgAdc",
  fsrAU: "Sensor_data/FSR/fsrAU",
  micLevel: "Sensor_data/INMP441/micLevel",
  onLine: "Sensor_data/TMP117/onLine",
  ecgLeadsOff: "Sensor_data/ADB232/ecgLeadsOff",
};

const formatTime = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const appendHistory = (entries: HistoryEntry[], value: number | null) => {
  if (value === null) return entries;
  const next = [...entries, { time: formatTime(), value }];
  return next.slice(-CHART_HISTORY_LENGTH);
};

export const useRealtimeSensors = () => {
  const [sensorData, setSensorData] = useState<SensorData>({
    maxHrBpm: null,
    maxSpO2: null,
    tempC: null,
    respBpm: null,
    ecgMappedmV: null,
    ecgAdc: null,
    fsrAU: null,
    micLevel: null,
    onLine: null,
    ecgLeadsOff: null,
  });

  const [history, setHistory] = useState<SensorHistory>({
    heartRate: [],
    temperature: [],
    spo2: [],
    respiration: [],
    ecg: [],
    pressure: [],
    mic: [],
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const listeners = [
      {
        key: "maxHrBpm" as const,
        path: FIREBASE_PATHS.maxHrBpm,
        historyKey: "heartRate" as const,
      },
      {
        key: "maxSpO2" as const,
        path: FIREBASE_PATHS.maxSpO2,
        historyKey: "spo2" as const,
      },
      {
        key: "tempC" as const,
        path: FIREBASE_PATHS.tempC,
        historyKey: "temperature" as const,
      },
      {
        key: "respBpm" as const,
        path: FIREBASE_PATHS.respBpm,
        historyKey: "respiration" as const,
      },
      {
        key: "ecgMappedmV" as const,
        path: FIREBASE_PATHS.ecgMappedmV,
        historyKey: "ecg" as const,
      },
      {
        key: "ecgAdc" as const,
        path: FIREBASE_PATHS.ecgAdc,
        historyKey: "ecg" as const,
      },
      {
        key: "fsrAU" as const,
        path: FIREBASE_PATHS.fsrAU,
        historyKey: "pressure" as const,
      },
      {
        key: "micLevel" as const,
        path: FIREBASE_PATHS.micLevel,
        historyKey: "mic" as const,
      },
      {
        key: "onLine" as const,
        path: FIREBASE_PATHS.onLine,
      },
      {
        key: "ecgLeadsOff" as const,
        path: FIREBASE_PATHS.ecgLeadsOff,
      },
    ];

    const unsubscribes = listeners.map((listener) =>
      onValue(ref(database, listener.path), (snapshot) => {
        const value = toNumber(snapshot.val());

        setSensorData((prev) => ({
          ...prev,
          [listener.key]: value,
        }));

        if (listener.historyKey) {
          setHistory((prev) => ({
            ...prev,
            [listener.historyKey]: appendHistory(prev[listener.historyKey], value),
          }));
        }

        setLastUpdated(new Date());
      }),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const ecgValue = useMemo(() => {
    if (sensorData.ecgMappedmV !== null) return sensorData.ecgMappedmV;
    if (sensorData.ecgAdc !== null) return sensorData.ecgAdc;
    return null;
  }, [sensorData.ecgMappedmV, sensorData.ecgAdc]);

  return { sensorData, history, lastUpdated, ecgValue };
};
