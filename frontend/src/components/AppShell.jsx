import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Terminal, Users, FileText, ListTodo, BarChart3, Settings, LogOut } from "lucide-react";
import ChatWidget from "./ChatWidget";

export default function AppShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isAdmin = user && (user.role === "super_admin" || user.role === "admin");

  const doLogout = () => { logout(); nav("/"); };

  const link = ({ isActive }) => `side-item ${isActive ? "active" : ""}`;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-card flex flex-col">
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-center gap-2 font-display font-bold text-sm" data-testid="sidebar-brand">
            <span className="inline-block w-2 h-2 bg-primary" />
            COMPANY/OS
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase text-muted-foreground truncate">{user?.company_name}</div>
        </div>
        <nav className="flex-1 py-3 flex flex-col">
          <NavLink to="/app" end className={link} data-testid="nav-dashboard"><Terminal className="w-4 h-4"/> Overview</NavLink>
          <NavLink to="/app/tasks" className={link} data-testid="nav-tasks"><ListTodo className="w-4 h-4"/> My Tasks</NavLink>
          {isAdmin && <NavLink to="/app/users" className={link} data-testid="nav-users"><Users className="w-4 h-4"/> Users</NavLink>}
          {isAdmin && <NavLink to="/app/context" className={link} data-testid="nav-context"><FileText className="w-4 h-4"/> Context</NavLink>}
          {isAdmin && <NavLink to="/app/crm" className={link} data-testid="nav-crm"><ListTodo className="w-4 h-4"/> CRM</NavLink>}
          {isAdmin && <NavLink to="/app/analytics" className={link} data-testid="nav-analytics"><BarChart3 className="w-4 h-4"/> Analytics</NavLink>}
          {isAdmin && <NavLink to="/app/settings" className={link} data-testid="nav-settings"><Settings className="w-4 h-4"/> Settings</NavLink>}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="text-xs mb-2 truncate" data-testid="sidebar-user">{user?.name}</div>
          <div className="badge mb-3">{user?.role}</div>
          <button onClick={doLogout} className="btn-ghost w-full flex items-center gap-2 text-xs" data-testid="btn-logout">
            <LogOut className="w-3 h-3"/> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
