import { X, Filter } from "lucide-react";

/**
 * Reusable filter chip bar. Backed by URL search params (via `filters` + `onChange`).
 * Each field: { key, label, options: [{ value, label }] } — value=null clears.
 *
 * Usage:
 *   const [filters, setFilters] = useState({});
 *   <FilterBar fields={FIELDS} filters={filters} onChange={setFilters} />
 */
export default function FilterBar({ fields, filters, onChange, extra = null, testid = "filter-bar" }) {
  const set = (k, v) => {
    const next = { ...filters };
    if (v == null || v === "") delete next[k]; else next[k] = v;
    onChange(next);
  };
  const clearAll = () => onChange({});
  const activeCount = Object.keys(filters || {}).filter((k) => filters[k] != null && filters[k] !== "").length;

  return (
    <div className="border border-border bg-card p-3 flex items-center gap-2 flex-wrap" data-testid={testid}>
      <div className="flex items-center gap-1.5 pr-2 border-r border-border">
        <Filter className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">filters</span>
      </div>

      {fields.map((f) => {
        if (f.type === "text") {
          return (
            <input
              key={f.key}
              type="text"
              placeholder={f.label}
              value={filters[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              data-testid={`filter-${f.key}`}
              className="input-tech text-xs h-7 w-40"
            />
          );
        }
        return (
          <div key={f.key} className="flex items-center gap-1" data-testid={`filter-group-${f.key}`}>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{f.label}:</span>
            <div className="flex items-center gap-1">
              {f.options.map((opt) => {
                const isActive = filters[f.key] === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => set(f.key, isActive ? null : opt.value)}
                    data-testid={`filter-${f.key}-${opt.value ?? "all"}`}
                    className={`text-[11px] font-mono uppercase tracking-wider px-2 py-1 border transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {extra}

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          data-testid="filter-clear-all"
          className="ml-auto text-[10px] font-mono uppercase tracking-widest text-primary hover:text-foreground flex items-center gap-1"
        >
          <X className="w-3 h-3" /> clear ({activeCount})
        </button>
      )}
    </div>
  );
}
