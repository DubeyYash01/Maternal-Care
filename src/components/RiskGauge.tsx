import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

type RiskGaugeProps = {
  score: number;
  label?: string;
  size?: number;
};

const colorForScore = (s: number) => {
  if (s >= 80) return ["#ef4444", "#f97316"];
  if (s >= 65) return ["#f97316", "#f59e0b"];
  if (s >= 40) return ["#f59e0b", "#eab308"];
  return ["#10b981", "#7DCBF4"];
};

export const RiskGauge = ({ score, label = "Risk", size = 220 }: RiskGaugeProps) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const motionScore = useMotionValue(0);
  const display = useTransform(motionScore, (v) => Math.round(v));

  useEffect(() => {
    const c = animate(motionScore, safeScore, { duration: 1.2, ease: "easeOut" });
    return c.stop;
  }, [safeScore, motionScore]);

  const [c1, c2] = colorForScore(safeScore);
  const radius = size * 0.42;
  const circumference = 2 * Math.PI * radius;
  const offset = useTransform(motionScore, (v) => circumference * (1 - v / 100));

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Halo glow */}
      <motion.div
        aria-hidden
        className="absolute inset-2 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${c2}55, transparent 70%)` }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={`gauge-${c1}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={size * 0.06}
          fill="none"
          opacity={0.35}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gauge-${c1})`}
          strokeWidth={size * 0.06}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, filter: `drop-shadow(0 0 10px ${c2}aa)` }}
        />
        {/* Tick marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i / 36) * Math.PI * 2;
          const inner = radius - size * 0.05;
          const outer = radius - size * 0.02;
          const cx = size / 2 + Math.cos(angle) * inner;
          const cy = size / 2 + Math.sin(angle) * inner;
          const ox = size / 2 + Math.cos(angle) * outer;
          const oy = size / 2 + Math.sin(angle) * outer;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={ox}
              y2={oy}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
        <motion.span
          className="bg-gradient-to-r bg-clip-text text-5xl font-semibold text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`,
          }}
        >
          <motion.span>{display}</motion.span>
        </motion.span>
        <span className="text-[11px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

export default RiskGauge;
