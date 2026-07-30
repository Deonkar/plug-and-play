import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import api from "../lib/api";
import AddOnPicker, { ADDONS } from "../components/AddOnPicker";

export default function AppServices() {
  const [picked, setPicked] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/services/mine");
        setPicked(new Set(data.services || []));
      } catch { /* first-time — empty */ }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    await api.put("/services/mine", { services: Array.from(picked) });
  };

  const goCheckout = async () => {
    await save();
    nav("/app/services/checkout");
  };

  const selected = ADDONS.filter((a) => picked.has(a.key));
  const monthly = selected.reduce((sum, a) => sum + (a.monthly || 0), 0);
  const oneTime = selected.reduce((sum, a) => sum + (a.oneTime || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// services</div>
          <h1 className="font-display font-black text-4xl">Add-on services</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
            Toggle any service to add it to your workspace. Save your picks, then head to checkout to
            confirm the bundle and pay.
          </p>
        </div>
        <Package className="w-8 h-8 text-primary" />
      </div>

      {loading ? (
        <div className="text-muted-foreground font-mono">// loading current picks...</div>
      ) : (
        <>
          <AddOnPicker picked={picked} setPicked={setPicked} testidPrefix="app-addon" showSummary={false} />
          <div className="mt-8 border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 sticky bottom-4 bg-background/80 backdrop-blur px-4 py-4 border border-border">
            <div className="flex items-baseline gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Monthly</div>
                <div className="font-display font-black text-2xl text-primary">${monthly}</div>
              </div>
              {oneTime > 0 && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">One-time</div>
                  <div className="font-display font-black text-2xl">${oneTime}</div>
                </div>
              )}
              <div className="text-xs font-mono text-muted-foreground">{picked.size} selected</div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="btn-ghost" data-testid="services-save">Save picks</button>
              <button onClick={goCheckout} className="btn-primary flex items-center gap-2" disabled={picked.size === 0} data-testid="services-checkout">
                Proceed to payment <ArrowRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
