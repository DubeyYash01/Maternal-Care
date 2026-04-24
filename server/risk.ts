export type Vitals = {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  respiration: number | null;
  movement: number | null;
  online: number | null;
  ecgValue?: number | null;
  ecgHrBpm?: number | null;
  ecgLeadsOff?: number | null;
  micLevel?: number | null;
  movementHistory?: number[];
  ecgHistory?: number[];
};

export type RiskLevel = "Excellent" | "Stable" | "Monitor Closely" | "High Risk" | "Critical";

export type RiskFactor = {
  metric: string;
  value: string;
  band: string;
  impact: number;
};

export type RiskBreakdown = {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  singleAlerts: string[];
  combinations: string[];
  signalQuality: "good" | "partial" | "offline";
  reliability: {
    sensorOnline: boolean;
    ecgLeadsOff: boolean;
    missingSignals: string[];
  };
};

// 0 IS a valid value (e.g. movement, mic, ecg baseline). For physiological vitals
// like HR/SpO2/Temp/Resp, an exact 0 means the optical/thermal sensor failed to
// capture, so we still skip those from per-metric scoring (they surface as
// "missing signal" in the reliability panel instead).
const isPresentAllowZero = (v: number | null | undefined): v is number =>
  typeof v === "number" && !Number.isNaN(v);

const isPresentVital = (v: number | null | undefined): v is number =>
  typeof v === "number" && !Number.isNaN(v) && v !== 0;

// ---------------- Per-metric scoring (weighted) ----------------

const scoreHeartRate = (hr: number): { impact: number; band: string } => {
  if (hr >= 60 && hr <= 100) return { impact: 0, band: "Normal" };
  if (hr >= 101 && hr <= 110) return { impact: 8, band: "Mildly Elevated" };
  if (hr >= 111 && hr <= 130) return { impact: 18, band: "High" };
  if (hr > 130) return { impact: 25, band: "Critical High" };
  if (hr >= 50 && hr < 60) return { impact: 12, band: "Low Concern" };
  return { impact: 25, band: "Critical Low" };
};

const scoreSpo2 = (o: number): { impact: number; band: string } => {
  if (o >= 97 && o <= 100) return { impact: 0, band: "Optimal" };
  if (o >= 95 && o <= 96) return { impact: 8, band: "Monitor" };
  if (o >= 93 && o <= 94) return { impact: 18, band: "Concerning" };
  if (o >= 90 && o <= 92) return { impact: 28, band: "High Concern" };
  return { impact: 35, band: "Critical" };
};

const scoreTemperature = (t: number): { impact: number; band: string } => {
  if (t >= 36.1 && t <= 37.2) return { impact: 0, band: "Normal" };
  if (t >= 37.3 && t <= 37.9) return { impact: 6, band: "Elevated" };
  if (t >= 38.0 && t <= 38.9) return { impact: 14, band: "Fever Concern" };
  if (t >= 39) return { impact: 20, band: "Critical Fever" };
  if (t < 35.5) return { impact: 18, band: "Hypothermia Concern" };
  return { impact: 0, band: "Normal" };
};

const scoreRespiration = (r: number): { impact: number; band: string } => {
  if (r >= 12 && r <= 20) return { impact: 0, band: "Normal" };
  if (r >= 21 && r <= 24) return { impact: 6, band: "Elevated" };
  if (r >= 25 && r <= 30) return { impact: 11, band: "Concerning" };
  if (r > 30) return { impact: 15, band: "Critical High" };
  return { impact: 12, band: "Concerning Low" };
};

// Movement intelligence: only flag if pattern is anomalous.
const scoreMovement = (movement: number, history?: number[]): { impact: number; band: string } => {
  const samples = (history ?? []).filter((v) => Number.isFinite(v));
  if (samples.length < 4) return { impact: 0, band: "Insufficient Pattern" };

  const max = Math.max(...samples);
  const min = Math.min(...samples);
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance =
    samples.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / samples.length;
  const std = Math.sqrt(variance);

  if (max === 0 && samples.every((s) => s === 0)) {
    return { impact: 2, band: "No Movement Detected" };
  }
  const spikeThreshold = mean + 2 * std;
  const spikes = samples.filter((s) => s > spikeThreshold && s > 0).length;
  if (spikes >= 3) return { impact: 10, band: "Irregular Spikes" };
  if (spikes >= 1 && std > mean * 0.6) return { impact: 5, band: "Movement Event" };
  if (max - min > mean * 1.5 && mean > 0) return { impact: 3, band: "Variable Activity" };
  return { impact: 0, band: "Calm" };
};

// ECG intelligence: lead off, large mismatch with PPG-HR, or extremely flat trace
const scoreEcg = (
  v: Vitals,
): { impact: number; band: string; valueLabel: string } | null => {
  if (v.ecgLeadsOff === 1) {
    return { impact: 8, band: "Leads Disconnected", valueLabel: "lead off" };
  }
  // Compare ECG-derived HR to PPG HR if both present
  if (
    isPresentVital(v.ecgHrBpm ?? null) &&
    isPresentVital(v.heartRate) &&
    Math.abs((v.ecgHrBpm as number) - v.heartRate) > 25
  ) {
    return {
      impact: 6,
      band: "ECG/PPG Mismatch",
      valueLabel: `${Math.round(v.ecgHrBpm as number)} vs ${v.heartRate}`,
    };
  }
  // Flat ECG with sufficient samples
  const eh = (v.ecgHistory ?? []).filter((x) => Number.isFinite(x));
  if (eh.length >= 6) {
    const range = Math.max(...eh) - Math.min(...eh);
    if (range < 0.05) {
      return { impact: 5, band: "Flat ECG Trace", valueLabel: "no waveform" };
    }
  }
  return null;
};

// ---------------- Main engine ----------------

export function computeRisk(v: Vitals): RiskBreakdown {
  const factors: RiskFactor[] = [];
  const singleAlerts: string[] = [];
  let score = 0;

  let hrHigh = false;
  let hrLow = false;
  let spo2Low = false;
  let tempFever = false;
  let respHigh = false;
  let respLow = false;
  let ecgAbnormal = false;

  const missingSignals: string[] = [];

  if (isPresentVital(v.heartRate)) {
    const r = scoreHeartRate(v.heartRate);
    if (r.impact > 0) {
      factors.push({ metric: "Heart Rate", value: `${v.heartRate} BPM`, band: r.band, impact: r.impact });
      singleAlerts.push(`Heart rate ${r.band.toLowerCase()} (${v.heartRate} BPM)`);
      score += r.impact;
    }
    if (v.heartRate > 100) hrHigh = true;
    if (v.heartRate < 60) hrLow = true;
  } else {
    missingSignals.push("Heart Rate");
  }

  if (isPresentVital(v.spo2)) {
    const r = scoreSpo2(v.spo2);
    if (r.impact > 0) {
      factors.push({ metric: "SpO₂", value: `${v.spo2}%`, band: r.band, impact: r.impact });
      singleAlerts.push(`Oxygen saturation ${r.band.toLowerCase()} (${v.spo2}%)`);
      score += r.impact;
    }
    if (v.spo2 < 95) spo2Low = true;
  } else {
    missingSignals.push("SpO₂");
  }

  if (isPresentVital(v.temperature)) {
    const r = scoreTemperature(v.temperature);
    if (r.impact > 0) {
      factors.push({
        metric: "Temperature",
        value: `${v.temperature.toFixed(1)}°C`,
        band: r.band,
        impact: r.impact,
      });
      singleAlerts.push(`Temperature ${r.band.toLowerCase()} (${v.temperature.toFixed(1)}°C)`);
      score += r.impact;
    }
    if (v.temperature >= 38) tempFever = true;
  } else {
    missingSignals.push("Temperature");
  }

  if (isPresentVital(v.respiration)) {
    const r = scoreRespiration(v.respiration);
    if (r.impact > 0) {
      factors.push({
        metric: "Respiration",
        value: `${v.respiration} bpm`,
        band: r.band,
        impact: r.impact,
      });
      singleAlerts.push(`Respiration ${r.band.toLowerCase()} (${v.respiration} bpm)`);
      score += r.impact;
    }
    if (v.respiration > 20) respHigh = true;
    if (v.respiration < 12) respLow = true;
  } else {
    missingSignals.push("Respiration");
  }

  // Movement (0 IS valid)
  if (isPresentAllowZero(v.movement ?? null)) {
    const r = scoreMovement(v.movement as number, v.movementHistory);
    if (r.impact > 0) {
      factors.push({
        metric: "Movement",
        value: `${Math.round(v.movement as number)} AU`,
        band: r.band,
        impact: r.impact,
      });
      if (r.band === "Irregular Spikes" || r.band === "No Movement Detected") {
        singleAlerts.push(`Movement pattern: ${r.band.toLowerCase()}`);
      }
      score += r.impact;
    }
  }

  // ECG
  const ecgResult = scoreEcg(v);
  if (ecgResult) {
    factors.push({
      metric: "ECG",
      value: ecgResult.valueLabel,
      band: ecgResult.band,
      impact: ecgResult.impact,
    });
    singleAlerts.push(`ECG: ${ecgResult.band.toLowerCase()}`);
    score += ecgResult.impact;
    ecgAbnormal = true;
  }

  // Sensor offline
  let signalQuality: RiskBreakdown["signalQuality"] = "good";
  const offline = v.online === 0;
  if (offline) {
    factors.push({
      metric: "Sensor",
      value: "Offline",
      band: "Connectivity Lost",
      impact: 30,
    });
    singleAlerts.push("Sensor belt offline — connectivity lost");
    score += 30;
    signalQuality = "offline";
  } else {
    const present = [v.heartRate, v.spo2, v.temperature, v.respiration].filter(
      isPresentVital,
    ).length;
    if (present < 2) signalQuality = "partial";
  }

  // Multi-parameter combinations
  const combinations: string[] = [];
  if (spo2Low && respHigh) {
    combinations.push("Respiratory stress pattern: low SpO₂ with elevated respiration.");
    score += 5;
  }
  if (tempFever && hrHigh) {
    combinations.push("Physiological stress pattern: fever combined with elevated heart rate.");
    score += 5;
  }
  if (spo2Low && hrHigh && ecgAbnormal) {
    combinations.push("Cardiopulmonary concern: low SpO₂, high HR, and abnormal ECG together.");
    score += 10;
  } else if (spo2Low && hrHigh) {
    combinations.push("Circulatory strain: low SpO₂ paired with elevated heart rate.");
    score += 5;
  }
  if (
    (v.movement === 0 || (v.movementHistory && v.movementHistory.every((x) => x === 0))) &&
    (hrHigh || hrLow || spo2Low || tempFever || respHigh || respLow)
  ) {
    combinations.push("Wellness concern: low movement coupled with abnormal vitals.");
    score += 5;
  }
  if (offline && (hrHigh || hrLow || spo2Low || tempFever || respHigh)) {
    combinations.push("Device reliability warning: sensor offline while abnormal vitals were trending.");
    score += 10;
  }
  // Multi-vital instability (3+ abnormal metrics)
  const abnormalCount = [hrHigh || hrLow, spo2Low, tempFever, respHigh || respLow].filter(
    Boolean,
  ).length;
  if (abnormalCount >= 3) {
    combinations.push("Multi-vital instability detected across three or more parameters.");
    score += 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: RiskLevel = "Excellent";
  if (score >= 81) level = "Critical";
  else if (score >= 61) level = "High Risk";
  else if (score >= 41) level = "Monitor Closely";
  else if (score >= 21) level = "Stable";

  if (offline && (level === "Excellent" || level === "Stable")) {
    level = "Monitor Closely";
  }

  return {
    score,
    level,
    factors,
    singleAlerts,
    combinations,
    signalQuality,
    reliability: {
      sensorOnline: !offline && v.online !== null,
      ecgLeadsOff: v.ecgLeadsOff === 1,
      missingSignals,
    },
  };
}

export type LocalReport = {
  summary: string;
  recommendations: string[];
  report: string;
  trend: string;
};

export function localSummary(v: Vitals, b: RiskBreakdown): LocalReport {
  const ts = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const reportLines: string[] = [`Maternal Care Wellness Report — ${ts}`];
  reportLines.push("");
  reportLines.push("Live Vitals:");
  reportLines.push(`  · Heart Rate: ${isPresentVital(v.heartRate) ? `${v.heartRate} BPM` : "n/a"}`);
  reportLines.push(`  · SpO₂: ${isPresentVital(v.spo2) ? `${v.spo2}%` : "n/a"}`);
  reportLines.push(
    `  · Temperature: ${isPresentVital(v.temperature) ? `${v.temperature.toFixed(1)}°C` : "n/a"}`,
  );
  reportLines.push(
    `  · Respiration: ${isPresentVital(v.respiration) ? `${v.respiration} bpm` : "n/a"}`,
  );
  reportLines.push(`  · Movement (FSR): ${isPresentAllowZero(v.movement ?? null) ? `${Math.round(v.movement as number)} AU` : "n/a"}`);
  reportLines.push(`  · Sensor: ${v.online === 1 ? "Online" : v.online === 0 ? "Offline" : "Unknown"}`);
  reportLines.push("");
  reportLines.push(`Risk Score: ${b.score}/100 (${b.level})`);

  if (b.singleAlerts.length) {
    reportLines.push("");
    reportLines.push("Single-Parameter Alerts:");
    b.singleAlerts.forEach((a) => reportLines.push(`  · ${a}`));
  }
  if (b.combinations.length) {
    reportLines.push("");
    reportLines.push("Combined Observations:");
    b.combinations.forEach((c) => reportLines.push(`  · ${c}`));
  }

  let summary: string;
  let recommendations: string[];
  let trend: string;

  if (b.signalQuality === "offline") {
    summary = "Sensor belt is offline. Live wellness signals cannot be confirmed at this moment.";
    recommendations = [
      "Reconnect the belt and verify Wi-Fi.",
      "Check device power and battery level.",
      "Resume monitoring once signals reappear.",
    ];
    trend = "n/a";
  } else if (b.factors.length === 0) {
    summary = "All live signals are within healthy wellness ranges with no anomalies detected.";
    recommendations = [
      "Continue routine monitoring.",
      "Stay hydrated and rest as usual.",
    ];
    trend = "stable";
  } else {
    const top = b.factors.slice().sort((a, b) => b.impact - a.impact)[0];
    if (b.level === "Critical") {
      summary = `Critical wellness alert: ${top.metric} at ${top.value} (${top.band}).`;
      recommendations = [
        "Immediate attention advised — seek medical consultation now.",
        "Keep the belt connected for continuous monitoring.",
        "Stay calm and rest while assistance is arranged.",
      ];
      trend = "rising risk";
    } else if (b.level === "High Risk") {
      summary = `Elevated risk pattern detected. ${top.metric} at ${top.value} is ${top.band.toLowerCase()}.`;
      recommendations = [
        "Rest and recheck signals in 5 minutes.",
        "Recommend medical consultation if values persist.",
        "Recheck sensor placement for accuracy.",
      ];
      trend = "elevated";
    } else if (b.level === "Monitor Closely") {
      summary = `Mild deviation noted on ${top.metric.toLowerCase()} (${top.value} — ${top.band}).`;
      recommendations = [
        "Take a calm break and breathe steadily.",
        "Recheck sensor placement.",
        "Continue monitoring for the next several minutes.",
      ];
      trend = "watch";
    } else {
      summary = "Signals largely stable with minor variations within acceptable wellness ranges.";
      recommendations = ["Continue routine monitoring."];
      trend = "stable";
    }
  }

  reportLines.push("");
  reportLines.push("Recommendations:");
  recommendations.forEach((r) => reportLines.push(`  · ${r}`));
  reportLines.push("");
  reportLines.push("(Wellness monitoring guidance — not a medical diagnosis.)");

  return { summary, recommendations, report: reportLines.join("\n"), trend };
}
