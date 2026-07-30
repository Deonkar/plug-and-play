import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/theme";

export default function ThemeToggle({ className = "", testid = "theme-toggle" }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      data-testid={testid}
      className={`inline-flex items-center justify-center border border-border w-8 h-8 hover:border-primary/60 transition-colors ${className}`}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}
