import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", company_name: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const upd = (k)=>(e)=>setForm({...form, [k]: e.target.value});

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    const r = await register(form);
    setLoading(false);
    if (r.ok) nav("/app");
    else setErr(r.error);
  };

  return (
    <div className="min-h-screen grain relative flex items-center justify-start px-8 md:px-24">
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="font-mono text-xs text-muted-foreground mb-8 inline-block">← back</Link>
        <h1 className="font-display font-black text-4xl mb-2">Create workspace.</h1>
        <p className="text-muted-foreground text-sm mb-8 font-mono">// you become the super_admin</p>
        <form onSubmit={submit} className="space-y-4" data-testid="register-form">
          <div>
            <label className="font-mono text-xs uppercase text-muted-foreground">Company name</label>
            <input className="input-tech mt-1" required value={form.company_name} onChange={upd("company_name")} data-testid="reg-company" />
          </div>
          <div>
            <label className="font-mono text-xs uppercase text-muted-foreground">Your name</label>
            <input className="input-tech mt-1" required value={form.name} onChange={upd("name")} data-testid="reg-name" />
          </div>
          <div>
            <label className="font-mono text-xs uppercase text-muted-foreground">Email</label>
            <input className="input-tech mt-1" type="email" required value={form.email} onChange={upd("email")} data-testid="reg-email" />
          </div>
          <div>
            <label className="font-mono text-xs uppercase text-muted-foreground">Password</label>
            <input className="input-tech mt-1" type="password" required minLength={6} value={form.password} onChange={upd("password")} data-testid="reg-password" />
          </div>
          {err && <div className="text-sm text-primary font-mono" data-testid="reg-error">! {err}</div>}
          <button disabled={loading} className="btn-primary w-full" data-testid="reg-submit">
            {loading ? "..." : "Create workspace →"}
          </button>
        </form>
      </div>
    </div>
  );
}
