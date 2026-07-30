import { cn } from "@/lib/utils";

export default function StatCard({ label, value, accent, testid, delta, icon: Icon }) {
  return (
    <div
      className={cn(
        "group border p-5 bg-card relative overflow-hidden transition-colors",
        accent ? "border-primary" : "border-border hover:border-primary/60"
      )}
      data-testid={testid}
    >
      <div className="flex items-start justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        {Icon && <Icon className={cn("w-4 h-4", accent ? "text-primary" : "text-muted-foreground")} />}
      </div>
      <div className={cn("font-display font-black text-4xl mt-3", accent && "text-primary")}>{value}</div>
      {delta && <div className="text-[11px] font-mono text-muted-foreground mt-1">{delta}</div>}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
