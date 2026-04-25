import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cloud,
  Heart,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";

type Mode = "login" | "signup";

interface LoginProps {
  initialMode?: Mode;
}

const features = [
  { icon: Cloud, text: "Realtime vitals from belt to dashboard" },
  { icon: Sparkles, text: "AI-driven risk insights & predictions" },
  { icon: ShieldCheck, text: "HIPAA-ready encrypted pipeline" },
];

const Login = ({ initialMode = "login" }: LoginProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  // Sync mode with the current route so /login and /signup both render this page correctly.
  useEffect(() => {
    if (location.pathname === "/signup") setMode("signup");
    else if (location.pathname === "/login") setMode("login");
  }, [location.pathname]);

  const isLogin = mode === "login";

  const headerCopy = useMemo(
    () =>
      isLogin
        ? {
            badge: "Welcome back",
            title: "Sign in to your premium dashboard.",
            subtitle: "Live vitals, AI insights, and instant alerts — exactly where you left them.",
            cta: "Sign In",
            switchPrompt: "Don't have an account?",
            switchAction: "Create one",
          }
        : {
            badge: "Create account",
            title: "Start your maternal care journey.",
            subtitle: "Set up your account in seconds and unlock realtime monitoring.",
            cta: "Create Account",
            switchPrompt: "Already have an account?",
            switchAction: "Sign in",
          },
    [isLogin],
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = () => {
    const next = isLogin ? "signup" : "login";
    setMode(next);
    navigate(next === "signup" ? "/signup" : "/login", { replace: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSubmitting(true);
    // Lightweight optimistic auth — wired to real Firebase auth in next iteration.
    setTimeout(() => {
      setSubmitting(false);
      toast.success(isLogin ? "Welcome back to MaternalCare" : "Account created — welcome aboard");
      navigate("/dashboard", { replace: true });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="relative overflow-hidden">
        {/* Premium gradient backdrop */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50" />
          <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/25 via-secondary/20 to-accent/25 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-secondary/25 to-primary/25 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-6 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: Brand panel */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Premium Maternal Tech
              </span>

              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {headerCopy.title.split(" ").slice(0, -2).join(" ")}{" "}
                <span className="text-gradient">{headerCopy.title.split(" ").slice(-2).join(" ")}</span>
              </h1>

              <p className="max-w-lg text-lg text-muted-foreground">{headerCopy.subtitle}</p>

              <ul className="space-y-3">
                {features.map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3 backdrop-blur"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-glow">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-foreground/80">{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right: Auth glass card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative mx-auto w-full max-w-md"
            >
              {/* Halo */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-4 -z-10 rounded-[36px] bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 opacity-60 blur-2xl"
              />

              <div className="rounded-[28px] border border-white/60 bg-white/70 p-8 shadow-[0_30px_80px_-20px_rgba(124,58,237,0.25)] backdrop-blur-2xl">
                {/* Brand mark */}
                <div className="flex flex-col items-center gap-3 pb-6">
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-glow"
                  >
                    <Heart className="h-7 w-7 text-white" />
                  </motion.div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                    {headerCopy.badge}
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {isLogin ? "Sign in to MaternalCare" : "Create your account"}
                  </h2>
                  <p className="text-center text-sm text-muted-foreground">
                    {isLogin
                      ? "Continue monitoring your live vitals and alerts."
                      : "It only takes a few seconds to get started."}
                  </p>
                </div>

                {/* Mode pill */}
                <div className="mb-6 grid grid-cols-2 rounded-full border border-white/70 bg-white/60 p-1 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => mode !== "login" && switchMode()}
                    className={`relative rounded-full py-2 text-sm font-medium transition ${
                      isLogin ? "text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isLogin && (
                      <motion.span
                        layoutId="auth-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary shadow-glow"
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10">Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => mode !== "signup" && switchMode()}
                    className={`relative rounded-full py-2 text-sm font-medium transition ${
                      !isLogin ? "text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {!isLogin && (
                      <motion.span
                        layoutId="auth-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary shadow-glow"
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10">Sign Up</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Jane Doe"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="h-11 rounded-xl border-white/70 bg-white/70 pl-10 backdrop-blur focus-visible:ring-primary/40"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@maternalcare.io"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="h-11 rounded-xl border-white/70 bg-white/70 pl-10 backdrop-blur focus-visible:ring-primary/40"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="h-11 rounded-xl border-white/70 bg-white/70 pl-10 backdrop-blur focus-visible:ring-primary/40"
                        required
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className="h-11 rounded-xl border-white/70 bg-white/70 pl-10 backdrop-blur focus-visible:ring-primary/40"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="group relative h-12 w-full overflow-hidden rounded-full bg-gradient-to-r from-primary to-secondary text-base font-medium text-white shadow-glow transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_hsl(var(--secondary)/0.45)] disabled:opacity-70"
                  >
                    {submitting ? "Please wait…" : headerCopy.cta}
                    <ArrowRight className="ml-2 inline-block h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {headerCopy.switchPrompt}{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="font-medium text-primary hover:underline"
                  >
                    {headerCopy.switchAction}
                  </button>
                </p>

                <div className="mt-5 border-t border-border/40 pt-4 text-center text-[11px] text-muted-foreground">
                  By continuing you agree to our Terms &amp; Privacy Policy.
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                <Link to="/" className="hover:text-primary">
                  ← Back to homepage
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
