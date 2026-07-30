import { cn } from "@/lib/utils";

export default function PageHeader({ eyebrow, title, subtitle, actions, className }) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6", className)}>
      <div>
        {eyebrow && (
          <div className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-primary mb-2" data-testid="page-eyebrow">
            /// {eyebrow}
          </div>
        )}
        <h1 className="font-display font-black text-3xl md:text-5xl leading-none" data-testid="page-title">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
