import nodemailer from "nodemailer";

export type EmailTier = "moderate" | "high" | "critical";

export type AlertPayload = {
  tier: EmailTier;
  score: number;
  hr: number | null;
  spo2: number | null;
  temp: number | null;
  resp: number | null;
  geminiSummary?: string;
  timestamp: string;
};

export const ALERT_RECIPIENTS = [
  "yashdubeyenter15@gmail.com",
  "pandeysneha3004@gmail.com",
  "akankshadsingh02@gmail.com",
  "princesharma8050@gmail.com",
];

let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter | null => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransporter;
};

const fmt = (v: number | null | undefined, unit = "", digits = 0) => {
  if (typeof v !== "number" || Number.isNaN(v) || v === 0) return "n/a";
  return `${digits ? v.toFixed(digits) : Math.round(v)}${unit ? ` ${unit}` : ""}`;
};

const buildPlain = (p: AlertPayload): { subject: string; body: string; color: string; status: string } => {
  const vitals = [
    `HR: ${fmt(p.hr, "BPM")}`,
    `SpO2: ${fmt(p.spo2, "%")}`,
    `Temp: ${fmt(p.temp, "°C", 1)}`,
    `Resp: ${fmt(p.resp, "bpm")}`,
  ].join("\n");

  const aiNote = p.geminiSummary ? `\nAI Note:\n${p.geminiSummary}\n` : "";

  if (p.tier === "moderate") {
    return {
      status: "Moderate Risk",
      color: "#f59e0b",
      subject: "MaternalCare Alert: Moderate Risk Detected",
      body: `Hello,

The MaternalCare monitoring system has detected a Moderate Risk condition.

Current Risk Score: ${p.score}

Live Vitals:
${vitals}

Summary:
Some parameters are outside recommended wellness range.
${aiNote}
Recommended Action:
- Recheck patient condition
- Reposition belt sensors
- Repeat reading in 5 minutes
- Continue close monitoring

Time:
${p.timestamp}

System:
MaternalCare AI Monitoring
`,
    };
  }
  if (p.tier === "high") {
    return {
      status: "High Risk",
      color: "#ea580c",
      subject: "MaternalCare Warning: High Risk Condition",
      body: `Attention,

The MaternalCare system has identified a High Risk health condition.

Current Risk Score: ${p.score}

Live Vitals:
${vitals}

AI Interpretation:
Multiple abnormal vital signs detected.
${aiNote}
Recommended Action:
- Immediate caregiver attention advised
- Contact doctor / nurse
- Continue live monitoring
- Keep patient calm and stable

Time:
${p.timestamp}

System:
MaternalCare AI Monitoring
`,
    };
  }
  return {
    status: "Critical Emergency",
    color: "#e11d48",
    subject: "URGENT: MaternalCare Critical Emergency Alert",
    body: `URGENT ATTENTION REQUIRED

The MaternalCare AI engine has detected a CRITICAL emergency condition.

Current Risk Score: ${p.score}

Live Vitals:
${vitals}

Possible Severe Risk State Detected.
${aiNote}
Immediate Action:
- Seek emergency medical assistance
- Contact doctor immediately
- Verify sensor placement while responding
- Do not ignore this alert

Time:
${p.timestamp}

System:
MaternalCare Emergency Intelligence
`,
  };
};

const buildHtml = (p: AlertPayload, tpl: ReturnType<typeof buildPlain>) => {
  const vitalsRow = (label: string, val: string) =>
    `<tr><td style="padding:6px 12px;color:#64748b;font-size:13px">${label}</td><td style="padding:6px 12px;color:#0f172a;font-weight:600;font-size:13px;text-align:right">${val}</td></tr>`;

  const aiBlock = p.geminiSummary
    ? `<div style="margin-top:16px;padding:12px 14px;border-left:3px solid ${tpl.color};background:#f8fafc;border-radius:8px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:4px">AI Note</div><div style="font-size:13px;color:#0f172a;line-height:1.5">${p.geminiSummary}</div></div>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.08)">
    <tr><td style="background:${tpl.color};padding:18px 24px;color:#ffffff">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:.85">MaternalCare</div>
      <div style="font-size:20px;font-weight:700;margin-top:2px">${tpl.status} — Score ${p.score}/100</div>
    </td></tr>
    <tr><td style="padding:24px">
      <p style="margin:0 0 12px;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-line">${tpl.body
        .split("\n")
        .slice(0, 3)
        .join("\n")}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
        ${vitalsRow("Heart Rate", fmt(p.hr, "BPM"))}
        ${vitalsRow("SpO₂", fmt(p.spo2, "%"))}
        ${vitalsRow("Temperature", fmt(p.temp, "°C", 1))}
        ${vitalsRow("Respiration", fmt(p.resp, "bpm"))}
      </table>
      ${aiBlock}
      <div style="margin-top:18px;padding-top:14px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6;white-space:pre-line">${tpl.body
        .split("\n")
        .slice(-12)
        .join("\n")}</div>
      <div style="margin-top:14px;color:#94a3b8;font-size:11px">${p.timestamp}</div>
    </td></tr>
  </table>
</body></html>`;
};

export const sendAlertEmail = async (
  payload: AlertPayload,
): Promise<{ ok: true; messageId: string } | { ok: false; reason: string }> => {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, reason: "smtp_not_configured" };

  const tpl = buildPlain(payload);
  try {
    const info = await transporter.sendMail({
      from: `"MaternalCare AI" <${process.env.GMAIL_USER}>`,
      to: ALERT_RECIPIENTS.join(", "),
      subject: tpl.subject,
      text: tpl.body,
      html: buildHtml(payload, tpl),
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message.slice(0, 200) : "send_failed",
    };
  }
};
