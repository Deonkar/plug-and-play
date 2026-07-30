import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "../Logo";
import CursorGlow from "../CursorGlow";

const NAV = [
  { to: "/how", label: "How" },
  { to: "/stack", label: "Tech Stack" },
  { to: "/reference", label: "API Docs" },
  { to: "/faq", label: "FAQ" },
];

export default function MarketingLayout({ children, hideCursorGlow = false }) {
  const [open, setOpen] = useState(false);

  const linkCls = ({ isActive }) =>
    `font-mono text-xs uppercase tracking-widest transition-colors ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-white"
    }`;

  return (
    <div className="grain relative min-h-screen overflow-x-hidden">
      {!hideCursorGlow && <CursorGlow />}

      {/* NAV */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-16 py-5 border-b border-border bg-background/60 backdrop-blur-sm">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={linkCls} data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g,"-")}`}>
              {n.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login" data-testid="nav-login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" data-testid="nav-signup" className="btn-primary text-sm">Get access</Link>
        </div>
        <button onClick={() => setOpen(true)} className="md:hidden p-1.5" data-testid="marketing-menu-open">
          <Menu className="w-5 h-5"/>
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={()=>setOpen(false)} />
            <motion.div initial={{x:320}} animate={{x:0}} exit={{x:320}}
              transition={{type:"spring", damping:26, stiffness:260}}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-card border-l border-border p-6 md:hidden flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <Logo />
                <button onClick={()=>setOpen(false)} data-testid="marketing-menu-close"><X className="w-5 h-5"/></button>
              </div>
              <div className="flex flex-col gap-4 flex-1">
                {NAV.map(n => (
                  <NavLink key={n.to} to={n.to} className={linkCls} onClick={()=>setOpen(false)}>{n.label}</NavLink>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link to="/login" className="btn-ghost text-sm w-full text-center" onClick={()=>setOpen(false)}>Sign in</Link>
                <Link to="/register" className="btn-primary text-sm w-full text-center" onClick={()=>setOpen(false)}>Get access</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 px-6 md:px-16 py-10 border-t border-border font-mono text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-4 mt-16">
        <div className="flex items-center gap-3">
          <Logo variant="mark" size={16} />
          <span>COMPANY/OS © 2026 — built with Emergent</span>
        </div>
        <span>build_00.3.0 · plug-and-play · multi-tenant</span>
      </footer>
    </div>
  );
}
