import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Menu, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export const Navigation = () => {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { name: "About", href: "#about" },
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Live Dashboard", href: "#dashboard" },
    { name: "Future", href: "#future" },
    { name: "Team", href: "#team" },
  ];

  const isActive = (href: string) => {
    if (href.startsWith("#")) {
      return location.hash === href;
    }
    return location.pathname === href;
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-border transition-all ${
        isScrolled ? "bg-white/70 dark:bg-slate-950/70 shadow-soft backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-glow transition-all duration-300">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-gradient">MaternalCare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-full text-sm transition-all ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                {item.name}
              </a>
            ))}

            <Button variant="outline" asChild>
              <Link to="/login">Get Started</Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/80 backdrop-blur">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}

              <Button variant="outline" asChild className="mt-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>

              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setTheme(resolvedTheme === "dark" ? "light" : "dark");
                  setIsMenuOpen(false);
                }}
              >
                {resolvedTheme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
