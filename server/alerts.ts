import { sendAlertEmail, type EmailTier, ALERT_RECIPIENTS } from "./email";

export type AlertHistoryEntry = {
  id: string;
  timestamp: string;
  score: number;
  level: string;
  tier: EmailTier;
  emailSent: boolean;
  reason: string;
  recipients: number;
};

type EngineState = {
  currentTier: EmailTier | null;
  lastSentAt: number | null;
  lastSentTier: EmailTier | null;
  lastSentScore: number | null;
  belowThresholdSince: number | null; // ms when score first went < 60
  criticalSince: number | null;       // ms when current critical streak started
};

const RESET_WINDOW_MS = 10 * 60 * 1000;     // 10 min < 60 to reset
const CRITICAL_REMIND_MS = 15 * 60 * 1000;  // re-send critical after 15 min sustained
const WORSEN_DELTA = 8;                      // re-send same tier if score worsens by ≥8

const state: EngineState = {
  currentTier: null,
  lastSentAt: null,
  lastSentTier: null,
  lastSentScore: null,
  belowThresholdSince: null,
  criticalSince: null,
};

const history: AlertHistoryEntry[] = [];

export const tierFromScore = (score: number): EmailTier | null => {
  if (score >= 80) return "critical";
  if (score >= 75) return "high";
  if (score >= 65) return "moderate";
  return null;
};

const tierRank = (t: EmailTier | null): number =>
  t === "critical" ? 3 : t === "high" ? 2 : t === "moderate" ? 1 : 0;

export type AlertEvaluation = {
  tier: EmailTier | null;
  shouldSend: boolean;
  reason: string;
};

export const evaluateAlert = (score: number, now = Date.now()): AlertEvaluation => {
  const tier = tierFromScore(score);

  // Reset logic: score < 60 sustained for 10 min → clear last-sent memory
  if (score < 60) {
    if (state.belowThresholdSince === null) state.belowThresholdSince = now;
    if (now - state.belowThresholdSince >= RESET_WINDOW_MS) {
      state.lastSentTier = null;
      state.lastSentAt = null;
      state.lastSentScore = null;
      state.criticalSince = null;
    }
  } else {
    state.belowThresholdSince = null;
  }

  state.currentTier = tier;

  if (!tier) {
    return { tier: null, shouldSend: false, reason: "below_threshold" };
  }

  // Track critical streak
  if (tier === "critical") {
    if (state.criticalSince === null) state.criticalSince = now;
  } else {
    state.criticalSince = null;
  }

  const lastTierRank = tierRank(state.lastSentTier);
  const currentTierRank = tierRank(tier);

  // First entry into a tier
  if (state.lastSentTier === null) {
    return { tier, shouldSend: true, reason: "first_entry" };
  }

  // Tier increased upward
  if (currentTierRank > lastTierRank) {
    return { tier, shouldSend: true, reason: "tier_escalated" };
  }

  // Same tier — score worsened drastically
  if (
    currentTierRank === lastTierRank &&
    state.lastSentScore !== null &&
    score - state.lastSentScore >= WORSEN_DELTA
  ) {
    return { tier, shouldSend: true, reason: "score_worsened" };
  }

  // Critical sustained 15 min → reminder
  if (
    tier === "critical" &&
    state.criticalSince &&
    state.lastSentAt &&
    now - state.lastSentAt >= CRITICAL_REMIND_MS
  ) {
    return { tier, shouldSend: true, reason: "critical_15min_reminder" };
  }

  return { tier, shouldSend: false, reason: "throttled_same_tier" };
};

const recordHistory = (entry: AlertHistoryEntry) => {
  history.unshift(entry);
  if (history.length > 50) history.length = 50;
};

export type ProcessAlertInput = {
  score: number;
  level: string;
  hr: number | null;
  spo2: number | null;
  temp: number | null;
  resp: number | null;
  geminiSummary?: string;
};

export const processAlert = async (input: ProcessAlertInput) => {
  const evaluation = evaluateAlert(input.score);
  const now = Date.now();

  if (!evaluation.shouldSend || !evaluation.tier) {
    return {
      tier: evaluation.tier,
      sent: false,
      reason: evaluation.reason,
    };
  }

  const timestamp = new Date(now).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const result = await sendAlertEmail({
    tier: evaluation.tier,
    score: input.score,
    hr: input.hr,
    spo2: input.spo2,
    temp: input.temp,
    resp: input.resp,
    geminiSummary: input.geminiSummary,
    timestamp,
  });

  const entry: AlertHistoryEntry = {
    id: `alert_${now}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date(now).toISOString(),
    score: input.score,
    level: input.level,
    tier: evaluation.tier,
    emailSent: result.ok,
    reason: result.ok ? evaluation.reason : `${evaluation.reason} → ${("reason" in result && result.reason) || "send_error"}`,
    recipients: result.ok ? ALERT_RECIPIENTS.length : 0,
  };
  recordHistory(entry);

  if (result.ok) {
    state.lastSentTier = evaluation.tier;
    state.lastSentAt = now;
    state.lastSentScore = input.score;
  }

  return {
    tier: evaluation.tier,
    sent: result.ok,
    reason: entry.reason,
    messageId: result.ok ? result.messageId : undefined,
  };
};

export const getAlertHistory = (): AlertHistoryEntry[] => history.slice(0, 30);

export const getAlertEngineState = () => ({
  currentTier: state.currentTier,
  lastSentTier: state.lastSentTier,
  lastSentAt: state.lastSentAt,
  lastSentScore: state.lastSentScore,
  recipients: ALERT_RECIPIENTS,
  smtpConfigured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
});

// Test-only helper
export const __resetAlertEngine = () => {
  state.currentTier = null;
  state.lastSentAt = null;
  state.lastSentTier = null;
  state.lastSentScore = null;
  state.belowThresholdSince = null;
  state.criticalSince = null;
  history.length = 0;
};
