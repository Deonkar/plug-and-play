import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("cos_theme") || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", theme);
    if (theme === "dark") el.classList.add("dark"); else el.classList.remove("dark");
    try { localStorage.setItem("cos_theme", theme); } catch { /* ignore */ }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
