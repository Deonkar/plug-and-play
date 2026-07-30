import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu, X, Mail, Github, Linkedin, Twitter } from "lucide-react";
import Logo from "../Logo";
import CursorGlow from "../CursorGlow";
import ThemeToggle from "../ThemeToggle";

const NAV_MAIN = [
  { to: "/how", label: "How" },
  { to: "/stack", label: "Tech Stack" },
  { to: "/pricing", label: "Pricing" },
  { to: "/services", label: "Services" },
];
const NAV_MORE = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/reference", label: "API Docs" },
  { to: "/faq", label: "FAQ" },
];

export default function MarketingLayout({ children, hideCursorGlow = false }) {
  const [open, setOpen] = useState(false);
  const linkCls = ({ isActive }) =>
    `font-mono text-xs uppercase tracking-widest transition-colors ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="grain relative min-h-screen overflow-x-hidden">
      {!hideCursorGlow && <CursorGlow />}

      {/* NAV */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-16 py-5 border-b border-border bg-background/70 backdrop-blur-sm">
        <Logo />
        <div className="hidden lg:flex items-center gap-7">
          {[...NAV_MAIN, ...NAV_MORE].map((n) => (
            <NavLink key={n.to} to={n.to} className={linkCls} data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g,"-")}`}>
              {n.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" data-testid="nav-login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" data-testid="nav-signup" className="btn-primary text-sm">Get access</Link>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button onClick={() => setOpen(true)} className="p-1.5" data-testid="marketing-menu-open">
            <Menu className="w-5 h-5"/>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={()=>setOpen(false)} />
            <motion.div initial={{x:320}} animate={{x:0}} exit={{x:320}}
              transition={{type:"spring", damping:26, stiffness:260}}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-card border-l border-border p-6 md:hidden flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <Logo />
                <button onClick={()=>setOpen(false)} data-testid="marketing-menu-close"><X className="w-5 h-5"/></button>
              </div>
              <div className="flex flex-col gap-4 flex-1">
                {[...NAV_MAIN, ...NAV_MORE].map(n => (
                  <NavLink key={n.to} to={n.to} className={linkCls} onClick={()=>setOpen(false)}>{n.label}</NavLink>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link to="/login" className="btn-ghost text-sm w-full text-center" onClick={()=>setOpen(false)}>Sign in</Link>
                <Link to="/register" className="btn-primary text-sm w-full text-center" onClick={()=>setOpen(false)}>Register now</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10">{children}</main>

      {/* FOOTER — proper columns + socials */}
      <footer className="relative z-10 px-6 md:px-16 pt-16 pb-10 border-t border-border mt-16 bg-card">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Logo size={22} />
            <p className="text-sm text-muted-foreground mt-4 max-w-sm leading-relaxed">
              A plug-and-play operating system that turns your team's markdown, code and CRM data
              into one privacy-scoped chatbot. Built with taste.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {/* PLACEHOLDER: swap with your handles */}
              <a href="mailto:founder@companyos.dev" title="Email" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-email"><Mail className="w-4 h-4"/></a>
              <a href="https://github.com/your-handle" target="_blank" rel="noreferrer" title="GitHub" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-github"><Github className="w-4 h-4"/></a>
              <a href="https://linkedin.com/in/your-handle" target="_blank" rel="noreferrer" title="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-linkedin"><Linkedin className="w-4 h-4"/></a>
              <a href="https://x.com/your-handle" target="_blank" rel="noreferrer" title="Twitter" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-twitter"><Twitter className="w-4 h-4"/></a>
            </div>
          </div>
          <FootCol title="Product" links={[
            ["How", "/how"], ["Tech Stack", "/stack"], ["Pricing", "/pricing"], ["FAQ", "/faq"],
          ]} />
          <FootCol title="Developers" links={[
            ["API Docs", "/reference"], ["Register", "/register"], ["Sign in", "/login"],
          ]} />
          <FootCol title="Company" links={[
            ["About", "/about"], ["Contact", "/contact"],
          ]} />
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between gap-2 text-xs font-mono text-muted-foreground">
          <span>COMPANY/OS © 2026</span>
          <span>build_00.4.0 · plug-and-play · multi-tenant</span>
        </div>
      </footer>
    </div>
  );
}

function FootCol({ title, links }) {
  return (
    <div className="md:col-span-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">/// {title}</div>
      <ul className="space-y-2 text-sm">
        {links.map(([label, to]) => (
          <li key={to}><Link to={to} className="text-foreground hover:text-primary transition-colors">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
