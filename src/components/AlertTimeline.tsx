import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, AlertOctagon, ShieldCheck, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AlertEntry = {
  id: string;
  tier: "moderate" | "high" | "critical";
  score: number;
  level?: string;
  emailSent: boolean;
  reason?: string;
  recipients?: number;
  timestamp: string;
};

const tierMeta: Record<AlertEntry["tier"], { label: string; color: string; ring: string; Icon: any }> = {
  moderate: {
    label: "Moderate",
    color: "from-amber-400 to-amber-500",
    ring: "ring-amber-300/40",
    Icon: AlertTriangle,
  },
  high: {
    label: "High",
    color: "from-orange-500 to-rose-500",
    ring: "ring-orange-300/40",
    Icon: AlertOctagon,
  },
  critical: {
    label: "Critical",
    color: "from-rose-500 to-red-600",
    ring: "ring-rose-400/50",
    Icon: AlertOctagon,
  },
};

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const AlertTimeline = () => {
  const [history, setHistory] = useState<AlertEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alert-history");
      if (res.ok) {
        const data = await res.json();
        const entries = Array.isArray(data?.history)
          ? data.history
          : Array.isArray(data)
            ? data
            : [];
        setHistory(entries.slice(0, 20));
        setLastFetched(new Date());
      }
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <Card className="overflow-hidden rounded-3xl border-white/70 bg-gradient-to-br from-white via-white to-rose-50/40 shadow-soft">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-glow">
              <Bell className="h-4 w-4" />
            </span>
            Alert History Timeline
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Live record of every email alert dispatched to caregivers.
            {lastFetched && (
              <>
                {" "}
                Updated {lastFetched.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.
              </>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={loading}
          className="rounded-full"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium">All clear — no alerts yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              When risk reaches Moderate, High, or Critical, an automatic email goes out to caregivers and
              shows up here.
            </p>
          </div>
        ) : (
          <div className="relative pl-8">
            {/* spine */}
            <div className="absolute left-3 top-1 bottom-1 w-px bg-gradient-to-b from-primary/40 via-secondary/40 to-transparent" />
            <AnimatePresence initial={false}>
              {history.map((entry, i) => {
                const meta = tierMeta[entry.tier] ?? tierMeta.moderate;
                const Icon = meta.Icon;
                return (
                  <motion.div
                    key={entry.id ?? `${entry.timestamp}-${i}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.35, delay: i * 0.03 }}
                    className="relative mb-4 last:mb-0"
                  >
                    {/* dot */}
                    <span
                      className={`absolute -left-[22px] top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${meta.color} text-white shadow-glow ring-4 ${meta.ring}`}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-3 backdrop-blur-xl shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`rounded-full bg-gradient-to-r ${meta.color} text-white border-0`}
                          >
                            {meta.label}
                          </Badge>
                          <span className="text-xs font-medium text-foreground">
                            Risk score {entry.score}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {entry.emailSent
                          ? `Email delivered to ${entry.recipients ?? 4} caregivers — ${entry.reason ?? "alert"}.`
                          : entry.reason
                            ? `Not sent — ${entry.reason}.`
                            : "Not sent."}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertTimeline;
