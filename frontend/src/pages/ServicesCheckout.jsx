import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, Lock, Check, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import { ADDONS } from "../components/AddOnPicker";

export default function ServicesCheckout() {
  const [picked, setPicked] = useState([]);
  const [done, setDone] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/services/mine");
        setPicked(data.services || []);
      } catch { /* ignore */ }
    })();
  }, []);

  const selected = ADDONS.filter((a) => picked.includes(a.key));
  const monthly = selected.reduce((sum, a) => sum + (a.monthly || 0), 0);
  const oneTime = selected.reduce((sum, a) => sum + (a.oneTime || 0), 0);

  const confirm = async () => {
    await api.post("/services/checkout", { services: picked });
    setDone(true);
    setTimeout(() => nav("/app/services"), 2500);
  };

  return (
    <div className="p-8 max-w-3xl">
      <Link to="/app/services" className="font-mono text-xs text-muted-foreground inline-flex items-center gap-1 mb-6 hover:text-primary transition-colors">
        <ArrowLeft className="w-3 h-3"/> back to services
      </Link>
      <div className="mb-6">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// checkout</div>
        <h1 className="font-display font-black text-4xl">Review &amp; pay.</h1>
      </div>

      <div className="border border-border bg-card p-6 mb-4">
        <div className="font-display font-bold mb-4">Selected services</div>
        {selected.length === 0 ? (
          <div className="text-sm text-muted-foreground">No services selected. <Link to="/app/services" className="text-primary underline">Pick some →</Link></div>
        ) : (
          <ul className="divide-y divide-border">
            {selected.map((s) => (
              <li key={s.key} className="flex items-baseline justify-between py-2.5" data-testid={`checkout-row-${s.key}`}>
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                </div>
                <div className="font-mono text-sm text-primary shrink-0 ml-4">{s.pricing}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-border bg-card p-6 mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-display font-bold">Monthly total</div>
          <div className="font-display font-black text-2xl text-primary">${monthly}/mo</div>
        </div>
        {oneTime > 0 && (
          <div className="flex items-baseline justify-between">
            <div className="font-display font-bold">One-time total</div>
            <div className="font-display font-black text-2xl">${oneTime}</div>
          </div>
        )}
      </div>

      {done ? (
        <div className="border border-emerald-700 bg-emerald-950/40 p-6 text-center" data-testid="checkout-success">
          <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2"/>
          <div className="font-display font-bold text-lg mb-1">Order recorded.</div>
          <div className="text-sm text-muted-foreground">Payment integration is arriving soon. Redirecting to Services…</div>
        </div>
      ) : (
        <div className="border border-primary bg-gradient-to-br from-primary/10 to-transparent p-6">
          <div className="flex items-center gap-2 mb-3 font-display font-bold">
            <CreditCard className="w-4 h-4 text-primary"/> Payment
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Stripe checkout hooks into this button next — for now confirming records the order so our
            team can invoice you.
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <Lock className="w-3 h-3"/> PCI-compliant via Stripe (arriving soon)
            </div>
            <button onClick={confirm} disabled={selected.length === 0} className="btn-primary" data-testid="checkout-confirm">
              Confirm order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
