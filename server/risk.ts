export type Vitals = {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  respiration: number | null;
  movement: number | null;
  online: number | null;
};

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type RiskBreakdown = {
  score: number;
  level: RiskLevel;
  factors: string[];
  signalQuality: "good" | "partial" | "offline";
};

const isPresent = (v: number | null | undefined): v is number =>
  typeof v === "number" && !Number.isNaN(v) && v !== 0;

export function computeRisk(v: Vitals): RiskBreakdown {
  let score = 0;
  const factors: string[] = [];

  // Heart rate
  if (isPresent(v.heartRate)) {
    const hr = v.heartRate;
    if (hr > 120) {
      score += 25;
      factors.push(`Heart rate ${hr} BPM is high (>120).`);
    } else if (hr > 100) {
      score += 15;
      factors.push(`Heart rate ${hr} BPM is elevated (>100).`);
    } else if (hr < 55) {
      score += 25;
      factors.push(`Heart rate ${hr} BPM is low (<55).`);
    }
  }

  // SpO2
  if (isPresent(v.spo2)) {
    const o = v.spo2;
    if (o < 92) {
      score += 50;
      factors.push(`SpO₂ ${o}% is critically low (<92%).`);
    } else if (o < 95) {
      score += 35;
      factors.push(`SpO₂ ${o}% is below preferred range (<95%).`);
    } else if (o < 96) {
      score += 20;
      factors.push(`SpO₂ ${o}% needs watch (<96%).`);
    }
  }

  // Temperature
  if (isPresent(v.temperature)) {
    const t = v.temperature;
    if (t >= 38) {
      score += 30;
      factors.push(`Temperature ${t.toFixed(1)}°C indicates fever (≥38°C).`);
    } else if (t > 37.3) {
      score += 15;
      factors.push(`Temperature ${t.toFixed(1)}°C is mildly elevated.`);
    }
  }

  // Respiration
  if (isPresent(v.respiration)) {
    const r = v.respiration;
    if (r > 24) {
      score += 25;
      factors.push(`Respiration ${r} bpm is high (>24).`);
    } else if (r > 20) {
      score += 15;
      factors.push(`Respiration ${r} bpm is elevated (>20).`);
    } else if (r < 10) {
      score += 25;
      factors.push(`Respiration ${r} bpm is low (<10).`);
    }
  }

  // Sensor offline
  let signalQuality: RiskBreakdown["signalQuality"] = "good";
  if (v.online === 0) {
    score += 50;
    factors.push("Sensor is offline — vitals cannot be confirmed.");
    signalQuality = "offline";
  } else {
    const present = [v.heartRate, v.spo2, v.temperature, v.respiration].filter(isPresent).length;
    if (present < 2) signalQuality = "partial";
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: RiskLevel = "Low";
  if (score >= 70) level = "Critical";
  else if (score >= 45) level = "High";
  else if (score >= 20) level = "Moderate";

  return { score, level, factors, signalQuality };
}

export function localSummary(v: Vitals, b: RiskBreakdown): { summary: string; recommendation: string } {
  if (b.signalQuality === "offline") {
    return {
      summary: "Sensor belt is offline. Live vital readings are not currently available.",
      recommendation: "Reconnect the belt and verify the device power and Wi-Fi signal.",
    };
  }
  if (b.factors.length === 0) {
    return {
      summary: "All live vitals are within healthy ranges. No anomalies detected.",
      recommendation: "Continue routine monitoring and stay hydrated.",
    };
  }
  if (b.level === "Critical") {
    return {
      summary: `Critical signals detected. ${b.factors[0]}`,
      recommendation: "Seek medical guidance immediately and keep the belt connected.",
    };
  }
  if (b.level === "High") {
    return {
      summary: `Elevated risk pattern. ${b.factors[0]}`,
      recommendation: "Rest, recheck vitals in 5 minutes, and contact your clinician if persistent.",
    };
  }
  if (b.level === "Moderate") {
    return {
      summary: `Mild deviation noted. ${b.factors[0]}`,
      recommendation: "Take a calm break and continue monitoring; recheck sensor placement.",
    };
  }
  return {
    summary: "Vitals largely stable with minor variations.",
    recommendation: "Continue routine monitoring.",
  };
}
