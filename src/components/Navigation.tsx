import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "About", href: "#about" },
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Live Dashboard", href: "/dashboard" },
  { name: "Future", href: "#future" },
  { name: "Team", href: "#team" },
];

export const Navigation = () => {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection-based section highlighting
  useEffect(() => {
    if (!isLanding) return;
    const ids = navItems.map((n) => n.href.replace("#", ""));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the entry most centered on screen
        let best: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (best?.target?.id) setActiveSection("#" + best.target.id);
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.05, 0.25, 0.5, 0.75, 1],
      },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [isLanding]);

  const isActive = (href: string) => {
    if (href.startsWith("#")) {
      if (!isLanding) return false;
      return activeSection === href;
    }
    return location.pathname === href;
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "border-b border-white/40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl shadow-[0_8px_32px_-12px_rgba(125,203,244,0.25)]"
          : "border-b border-transparent bg-white/30 dark:bg-slate-950/30 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.08 }}
              transition={{ duration: 0.5 }}
              className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow"
            >
              <Heart className="h-4 w-4 text-white" />
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary opacity-50 blur-md -z-10" />
            </motion.div>
            <span className="text-xl font-semibold text-gradient tracking-tight">MaternalCare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const isAnchor = item.href.startsWith("#");
              const href = isAnchor && !isLanding ? `/${item.href}` : item.href;
              const linkClassName = "relative px-3 py-2 rounded-full text-sm transition-all";
              const inner = (
                <>
                  <span
                    className={`relative z-10 transition-colors ${
                      active ? "text-primary font-semibold" : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {item.name}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/15 to-secondary/15 ring-1 ring-primary/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              );
              return isAnchor ? (
                <a key={item.href} href={href} className={linkClassName}>
                  {inner}
                </a>
              ) : (
                <Link key={item.href} to={href} className={linkClassName}>
                  {inner}
                </Link>
              );
            })}

            <Button
              asChild
              className="ml-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-glow hover:scale-[1.04] transition-transform"
            >
              <Link to="/login">Get Started</Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-1 py-3 border-t border-border/40">
                {navItems.map((item) => {
                  const isAnchor = item.href.startsWith("#");
                  const href = isAnchor && !isLanding ? `/${item.href}` : item.href;
                  const className = `px-3 py-2.5 rounded-xl transition-all ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-primary/15 to-secondary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`;
                  return isAnchor ? (
                    <a
                      key={item.href}
                      href={href}
                      className={className}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      to={href}
                      className={className}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  );
                })}

                <Button
                  asChild
                  className="mt-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white"
                >
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  className="justify-start rounded-xl"
                  onClick={() => {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark");
                    setIsMenuOpen(false);
                  }}
                >
                  {resolvedTheme === "dark" ? "Switch to Light" : "Switch to Dark"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
