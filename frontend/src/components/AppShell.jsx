import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth";
import {
  Terminal, Users, FileText, ListTodo, BarChart3, Settings, LogOut, Menu, X,
} from "lucide-react";
import ChatWidget from "./ChatWidget";
import Badge from "./ui/pill";
import Logo from "./Logo";

export default function AppShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user && (user.role === "super_admin" || user.role === "admin");

  const doLogout = () => { logout(); nav("/"); };
  const linkCls = ({ isActive }) => `side-item ${isActive ? "active" : ""}`;
  const closeMobile = () => setMobileOpen(false);

  const links = (
    <>
      <NavLink to="/app" end className={linkCls} data-testid="nav-dashboard" onClick={closeMobile}><Terminal className="w-4 h-4"/> Overview</NavLink>
      {!isAdmin && <NavLink to="/app/tasks" className={linkCls} data-testid="nav-tasks" onClick={closeMobile}><ListTodo className="w-4 h-4"/> My Tasks</NavLink>}
      {isAdmin && <NavLink to="/app/users" className={linkCls} data-testid="nav-users" onClick={closeMobile}><Users className="w-4 h-4"/> Users</NavLink>}
      {isAdmin && <NavLink to="/app/context" className={linkCls} data-testid="nav-context" onClick={closeMobile}><FileText className="w-4 h-4"/> Context</NavLink>}
      {isAdmin && <NavLink to="/app/crm" className={linkCls} data-testid="nav-crm" onClick={closeMobile}><ListTodo className="w-4 h-4"/> CRM</NavLink>}
      {isAdmin && <NavLink to="/app/analytics" className={linkCls} data-testid="nav-analytics" onClick={closeMobile}><BarChart3 className="w-4 h-4"/> Analytics</NavLink>}
      {isAdmin && <NavLink to="/app/settings" className={linkCls} data-testid="nav-settings" onClick={closeMobile}><Settings className="w-4 h-4"/> Settings</NavLink>}
    </>
  );

  const brand = (
    <div className="px-4 py-5 border-b border-border">
      <Logo size={18} testid="sidebar-brand" />
      <div className="mt-1.5 text-[10px] font-mono uppercase text-muted-foreground truncate">{user?.company_name}</div>
    </div>
  );

  const footer = (
    <div className="p-3 border-t border-border">
      <div className="text-xs mb-2 truncate" data-testid="sidebar-user">{user?.name}</div>
      <Badge>{user?.role}</Badge>
      <button onClick={doLogout} className="btn-ghost w-full flex items-center gap-2 text-xs mt-3" data-testid="btn-logout">
        <LogOut className="w-3 h-3"/> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur">
        <Logo size={16} />
        <button onClick={()=>setMobileOpen(true)} className="p-1.5" data-testid="mobile-menu-open">
          <Menu className="w-5 h-5"/>
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-56 border-r border-border bg-card flex-col shrink-0">
        {brand}
        <nav className="flex-1 py-3 flex flex-col">{links}</nav>
        {footer}
      </aside>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="md:hidden fixed inset-0 bg-black/60 z-50" onClick={closeMobile} />
            <motion.aside
              initial={{x:-320}} animate={{x:0}} exit={{x:-320}}
              transition={{type:"spring", damping:26, stiffness:260}}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-card border-r border-border flex flex-col"
              data-testid="mobile-drawer"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <Logo size={16} />
                <button onClick={closeMobile} data-testid="mobile-menu-close"><X className="w-5 h-5"/></button>
              </div>
              <nav className="flex-1 py-3 flex flex-col overflow-y-auto">{links}</nav>
              {footer}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
