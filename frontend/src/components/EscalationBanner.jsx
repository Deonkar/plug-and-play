import { useEffect, useState } from "react";
import api from "../lib/api";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function EscalationBanner() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data } = await api.get("/escalations");
        if (!cancelled) setData(data);
      } catch { /* silent */ }
    };
    run();
    const iv = setInterval(run, 60000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);
  if (!data || data.total === 0) return null;
  return (
    <div className="border-l-4 border-primary bg-primary/10 px-5 py-3 mb-6 flex items-start gap-3" data-testid="escalation-banner">
      <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5"/>
      <div className="flex-1">
        <div className="font-display font-bold text-sm">
          {data.total} escalation{data.total>1?"s":""} needs attention
        </div>
        <div className="text-xs text-muted-foreground mt-1 font-mono">
          {data.tasks.slice(0,3).map(t => `task:${t.id.slice(0,6)} ${t.title}`).join(" · ")}
          {data.leads.length > 0 && ` · ${data.leads.length} untouched hot lead${data.leads.length>1?"s":""}`}
        </div>
      </div>
      <Link to="/app/tasks" className="btn-ghost text-xs" data-testid="escalation-view">View →</Link>
    </div>
  );
}
