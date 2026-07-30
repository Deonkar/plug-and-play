import { cn } from "@/lib/utils";

/**
 * A stylized fake browser chrome that wraps any content — used for demo reels.
 */
export default function BrowserFrame({ url = "crm.acme.com", children, className, testid }) {
  return (
    <div
      className={cn("border border-border bg-[#0a0a0a] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] overflow-hidden", className)}
      data-testid={testid}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-black/60">
        <span className="w-2.5 h-2.5 border border-primary/60 bg-primary/30" />
        <span className="w-2.5 h-2.5 border border-neutral-700 bg-neutral-800" />
        <span className="w-2.5 h-2.5 border border-neutral-700 bg-neutral-800" />
        <div className="ml-4 flex-1 max-w-md">
          <div className="font-mono text-[10px] text-muted-foreground bg-black/70 border border-neutral-800 px-3 py-1 truncate">
            https://{url}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          live
        </div>
      </div>
      <div className="relative demo-dark">{children}</div>
    </div>
  );
}
