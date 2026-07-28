import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@acme.demo");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    const r = await login(email, password);
    setLoading(false);
    if (r.ok) nav("/app");
    else setErr(r.error);
  };

  return (
    <div className="min-h-screen grain relative flex items-center justify-start px-8 md:px-24">
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="font-mono text-xs text-muted-foreground mb-8 inline-block" data-testid="back-home">← back</Link>
        <h1 className="font-display font-black text-4xl mb-2">Sign in.</h1>
        <p className="text-muted-foreground text-sm mb-8 font-mono">// authenticate to your Company/OS</p>
        <form onSubmit={submit} className="space-y-4" data-testid="login-form">
          <div>
            <label className="font-mono text-xs uppercase text-muted-foreground">Email</label>
            <input className="input-tech mt-1" type="email" required value={email}
              onChange={(e)=>setEmail(e.target.value)} data-testid="login-email" />
          </div>
          <div>
            <label className="font-mono text-xs uppercase text-muted-foreground">Password</label>
            <input className="input-tech mt-1" type="password" required value={password}
              onChange={(e)=>setPassword(e.target.value)} data-testid="login-password" />
          </div>
          {err && <div className="text-sm text-primary font-mono" data-testid="login-error">! {err}</div>}
          <button disabled={loading} className="btn-primary w-full" data-testid="login-submit">
            {loading ? "..." : "Sign in →"}
          </button>
        </form>
        <div className="mt-6 text-sm text-muted-foreground">
          New here? <Link to="/register" className="text-primary underline" data-testid="to-register">Create a workspace</Link>
        </div>
      </div>
    </div>
  );
}
