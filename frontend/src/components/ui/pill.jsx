import { cn } from "@/lib/utils";

const styles = {
  urgent: "border-primary text-primary",
  hot: "border-primary text-primary",
  high: "border-orange-500 text-orange-400",
  warm: "border-orange-500 text-orange-400",
  medium: "border-neutral-500 text-neutral-300",
  new: "border-neutral-500 text-neutral-300",
  low: "border-neutral-700 text-neutral-500",
  cold: "border-neutral-700 text-neutral-500",
  done: "border-emerald-600 text-emerald-400",
  active: "border-emerald-600 text-emerald-400",
  blocked: "border-primary text-primary",
};

export default function Badge({ children, tone, className }) {
  const key = String(children || "").toLowerCase();
  const cls = styles[tone || key] || "border-neutral-700 text-neutral-400";
  return (
    <span className={cn("inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border", cls, className)}>
      {children}
    </span>
  );
}
