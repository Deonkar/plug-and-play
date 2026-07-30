import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import MarketingLayout from "../../components/marketing/MarketingLayout";
import AddOnPicker, { useAddonSet } from "../../components/AddOnPicker";
import api from "../../lib/api";

export default function Services() {
  const [picked, setPicked] = useAddonSet(["byok", "slack"]);
  const [form, setForm] = useState({ email: "", note: "" });
  const [state, setState] = useState({ loading: false, ok: false, err: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (picked.size === 0) { setState({ loading: false, ok: false, err: "Pick at least one service" }); return; }
    setState({ loading: true, ok: false, err: "" });
    try {
      await api.post("/public/services-estimate", {
        email: form.email,
        note: form.note,
        services: Array.from(picked),
      });
      setState({ loading: false, ok: true, err: "" });
      setForm({ email: "", note: "" });
    } catch (er) {
      setState({ loading: false, ok: false, err: er.response?.data?.detail || "Something went wrong" });
    }
  };

  return (
    <MarketingLayout>
      <section className="px-6 md:px-16 pt-16 pb-16">
        <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3 flex items-center gap-2">
          <Sparkles className="w-3 h-3"/> /// build your own bundle
        </div>
        <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] max-w-3xl">
          Add just what you need. <span className="text-primary">Skip the rest.</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mt-6 text-lg leading-relaxed">
          Pick the extras that fit your team. Everything is monthly, no lock-in. We'll send you a
          personalised estimate — no payment on this page.
        </p>
      </section>

      <section className="px-6 md:px-16 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="max-w-5xl"
        >
          <AddOnPicker picked={picked} setPicked={setPicked} testidPrefix="svc-addon" />
        </motion.div>
      </section>

      <section className="px-6 md:px-16 pb-24">
        <div className="border border-primary p-6 md:p-10 bg-gradient-to-br from-primary/10 to-transparent max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">/// request an estimate</div>
          <h2 className="font-display font-black text-3xl mb-4">Estimate will be sent soon.</h2>
          <p className="text-muted-foreground mb-6 max-w-lg text-sm">
            Drop your email and any note about your team size or use case. We'll come back with a
            tailored quote for your selected services within 24 hours.
          </p>
          <form onSubmit={submit} className="space-y-4" data-testid="services-estimate-form">
            <input
              type="email" required value={form.email}
              onChange={(e)=>setForm({...form, email: e.target.value})}
              placeholder="you@company.com"
              className="input-tech" data-testid="services-email"
            />
            <textarea
              value={form.note}
              onChange={(e)=>setForm({...form, note: e.target.value})}
              placeholder="Team size, CRM in use, anything else we should know..."
              className="input-tech min-h-[100px]" rows={4} data-testid="services-note"
            />
            {state.err && <div className="text-primary text-xs font-mono">! {state.err}</div>}
            {state.ok && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm border border-emerald-800 bg-emerald-950/40 px-3 py-2" data-testid="services-success">
                <Check className="w-4 h-4"/> Got it — estimate incoming within 24 hours.
              </div>
            )}
            <button disabled={state.loading} className="btn-primary flex items-center gap-2" data-testid="services-submit">
              {state.loading ? "Sending..." : <>Send my picks <ArrowRight className="w-4 h-4"/></>}
            </button>
          </form>
        </div>
      </section>

      <section className="px-6 md:px-16 py-24 border-t border-border">
        <div className="text-center max-w-2xl mx-auto">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">/// already a customer?</div>
          <p className="text-muted-foreground mb-4">
            Sign in and add services directly from your admin console — everything hooks straight
            to your workspace.
          </p>
          <Link to="/login?next=/app/services" className="btn-ghost inline-flex items-center gap-2" data-testid="services-login-cta">
            Manage services in your workspace <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
