export type Vitals = {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  respiration: number | null;
  movement: number | null;
  online: number | null;
  movementHistory?: number[];
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
  combinations: string[];
  signalQuality: "good" | "partial" | "offline";
};

const isPresent = (v: number | null | undefined): v is number =>
  typeof v === "number" && !Number.isNaN(v) && v !== 0;

// ---------------- Per-metric scoring (weighted) ----------------

const scoreHeartRate = (hr: number): { impact: number; band: string } => {
  if (hr >= 60 && hr <= 100) return { impact: 0, band: "Normal" };
  if (hr >= 101 && hr <= 110) return { impact: 8, band: "Mildly Elevated" };
  if (hr >= 111 && hr <= 130) return { impact: 18, band: "High" };
  if (hr > 130) return { impact: 25, band: "Critical High" };
  if (hr >= 50 && hr < 60) return { impact: 12, band: "Low Concern" };
  return { impact: 25, band: "Critical Low" }; // <50
};

const scoreSpo2 = (o: number): { impact: number; band: string } => {
  if (o >= 97 && o <= 100) return { impact: 0, band: "Optimal" };
  if (o >= 95 && o <= 96) return { impact: 8, band: "Monitor" };
  if (o >= 93 && o <= 94) return { impact: 18, band: "Concerning" };
  if (o >= 90 && o <= 92) return { impact: 28, band: "High Concern" };
  return { impact: 35, band: "Critical" }; // <90
};

const scoreTemperature = (t: number): { impact: number; band: string } => {
  if (t >= 36.1 && t <= 37.2) return { impact: 0, band: "Normal" };
  if (t >= 37.3 && t <= 37.9) return { impact: 6, band: "Elevated" };
  if (t >= 38.0 && t <= 38.9) return { impact: 14, band: "Fever Concern" };
  if (t >= 39) return { impact: 20, band: "Critical Fever" };
  if (t < 35.5) return { impact: 18, band: "Hypothermia Concern" };
  return { impact: 0, band: "Normal" }; // 35.5-36.0 acceptable
};

const scoreRespiration = (r: number): { impact: number; band: string } => {
  if (r >= 12 && r <= 20) return { impact: 0, band: "Normal" };
  if (r >= 21 && r <= 24) return { impact: 6, band: "Elevated" };
  if (r >= 25 && r <= 30) return { impact: 11, band: "Concerning" };
  if (r > 30) return { impact: 15, band: "Critical High" };
  return { impact: 12, band: "Concerning Low" }; // <10
};

// Movement intelligence: only flag if pattern is anomalous.
// - Sustained zero across history => "no movement" (informational, low impact)
// - Sudden large spikes vs baseline => movement event (low impact)
// - Repeated irregular spikes => discomfort (full impact)
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

  // Count irregular spikes: values > mean + 2*std
  const spikeThreshold = mean + 2 * std;
  const spikes = samples.filter((s) => s > spikeThreshold && s > 0).length;

  if (spikes >= 3) return { impact: 10, band: "Irregular Spikes" };
  if (spikes >= 1 && std > mean * 0.6) return { impact: 5, band: "Movement Event" };
  if (max - min > mean * 1.5 && mean > 0) return { impact: 3, band: "Variable Activity" };
  return { impact: 0, band: "Calm" };
};

// ---------------- Main engine ----------------

export function computeRisk(v: Vitals): RiskBreakdown {
  const factors: RiskFactor[] = [];
  let score = 0;

  // Track which metrics are abnormal for combo bonuses
  let hrHigh = false;
  let hrLow = false;
  let spo2Low = false;
  let tempFever = false;
  let respHigh = false;

  if (isPresent(v.heartRate)) {
    const r = scoreHeartRate(v.heartRate);
    if (r.impact > 0) {
      factors.push({ metric: "Heart Rate", value: `${v.heartRate} BPM`, band: r.band, impact: r.impact });
      score += r.impact;
    }
    if (v.heartRate > 100) hrHigh = true;
    if (v.heartRate < 60) hrLow = true;
  }

  if (isPresent(v.spo2)) {
    const r = scoreSpo2(v.spo2);
    if (r.impact > 0) {
      factors.push({ metric: "SpO₂", value: `${v.spo2}%`, band: r.band, impact: r.impact });
      score += r.impact;
    }
    if (v.spo2 < 95) spo2Low = true;
  }

  if (isPresent(v.temperature)) {
    const r = scoreTemperature(v.temperature);
    if (r.impact > 0) {
      factors.push({
        metric: "Temperature",
        value: `${v.temperature.toFixed(1)}°C`,
        band: r.band,
        impact: r.impact,
      });
      score += r.impact;
    }
    if (v.temperature >= 38) tempFever = true;
  }

  if (isPresent(v.respiration)) {
    const r = scoreRespiration(v.respiration);
    if (r.impact > 0) {
      factors.push({
        metric: "Respiration",
        value: `${v.respiration} bpm`,
        band: r.band,
        impact: r.impact,
      });
      score += r.impact;
    }
    if (v.respiration > 20) respHigh = true;
  }

  // Movement (only if a present value or history)
  if (v.movement !== null && v.movement !== undefined) {
    const r = scoreMovement(v.movement, v.movementHistory);
    if (r.impact > 0) {
      factors.push({
        metric: "Movement",
        value: `${Math.round(v.movement)} AU`,
        band: r.band,
        impact: r.impact,
      });
      score += r.impact;
    }
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
    score += 30;
    signalQuality = "offline";
  } else {
    const present = [v.heartRate, v.spo2, v.temperature, v.respiration].filter(isPresent).length;
    if (present < 2) signalQuality = "partial";
  }

  // Multi-parameter combinations
  const combinations: string[] = [];
  if (spo2Low && hrHigh) {
    combinations.push("Low SpO₂ paired with elevated heart rate suggests systemic strain.");
    score += 5;
  }
  if (tempFever && hrHigh) {
    combinations.push("Fever combined with elevated heart rate amplifies physiological stress.");
    score += 5;
  }
  if (spo2Low && respHigh) {
    combinations.push("Low SpO₂ with elevated respiration indicates respiratory load.");
    score += 5;
  }
  if (offline && (hrHigh || hrLow || spo2Low || tempFever || respHigh)) {
    combinations.push("Sensor offline while abnormal vitals were trending — verify connection urgently.");
    score += 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Status mapping
  let level: RiskLevel = "Excellent";
  if (score >= 81) level = "Critical";
  else if (score >= 61) level = "High Risk";
  else if (score >= 41) level = "Monitor Closely";
  else if (score >= 21) level = "Stable";

  // Offline floor: never report "Excellent" or "Stable" while sensor is offline
  if (offline && (level === "Excellent" || level === "Stable")) {
    level = "Monitor Closely";
  }

  return { score, level, factors, combinations, signalQuality };
}

export function localSummary(
  v: Vitals,
  b: RiskBreakdown,
): { summary: string; recommendation: string; trend: string } {
  if (b.signalQuality === "offline") {
    return {
      summary: "Sensor belt is offline. Live wellness signals cannot be confirmed at this moment.",
      recommendation: "Reconnect the belt and verify device power and Wi-Fi to resume monitoring.",
      trend: "n/a",
    };
  }
  if (b.factors.length === 0) {
    return {
      summary: "All live signals are within healthy wellness ranges with no anomalies detected.",
      recommendation: "Continue routine monitoring, hydrate, and rest as usual.",
      trend: "stable",
    };
  }
  const top = b.factors.slice().sort((a, b) => b.impact - a.impact)[0];
  if (b.level === "Critical") {
    return {
      summary: `Critical wellness alert. ${top.metric} at ${top.value} (${top.band}).`,
      recommendation: "Recommend immediate medical consultation while keeping the belt connected.",
      trend: "rising risk",
    };
  }
  if (b.level === "High Risk") {
    return {
      summary: `Elevated risk pattern detected. ${top.metric} at ${top.value} is ${top.band.toLowerCase()}.`,
      recommendation: "Rest, recheck signals in 5 minutes, and recommend consultation if persistent.",
      trend: "elevated",
    };
  }
  if (b.level === "Monitor Closely") {
    return {
      summary: `Mild deviation noted on ${top.metric.toLowerCase()} (${top.value} — ${top.band}).`,
      recommendation: "Take a calm break, recheck sensor placement, and continue monitoring.",
      trend: "watch",
    };
  }
  return {
    summary: "Signals largely stable with minor variations within acceptable wellness ranges.",
    recommendation: "Continue routine monitoring.",
    trend: "stable",
  };
}
