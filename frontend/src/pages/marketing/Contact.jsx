import { useState } from "react";
import { Mail, MessageSquare, Send, Check, Github, Linkedin, BookOpen } from "lucide-react";
import MarketingLayout from "../../components/marketing/MarketingLayout";
import api from "../../lib/api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [state, setState] = useState({ loading: false, ok: false, err: "" });
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, ok: false, err: "" });
    try {
      await api.post("/public/contact", form);
      setState({ loading: false, ok: true, err: "" });
      setForm({ name: "", email: "", company: "", message: "" });
    } catch (er) {
      setState({ loading: false, ok: false, err: er.response?.data?.detail || er.message || "Something went wrong" });
    }
  };

  return (
    <MarketingLayout>
      <section className="px-6 md:px-16 pt-16 pb-24 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// contact</div>
          <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] mb-6">
            Let's <span className="text-primary">talk.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Question, feature request, partnership idea, or just want to see a live install?
            Drop a note. I read every one.
          </p>
          <div className="space-y-4 text-sm">
            <ContactItem icon={Mail} label="Email">
              <a className="text-foreground hover:text-primary transition-colors" href="mailto:tylordyron@gmail.com" data-testid="contact-email-link">tylordyron@gmail.com</a>
            </ContactItem>
            <ContactItem icon={MessageSquare} label="Response time">Usually within 24 hours (weekdays)</ContactItem>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">/// or find me on</div>
            <div className="flex items-center gap-5 text-sm">
              <a href="https://github.com/Deonkar" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="contact-github">
                <Github className="w-4 h-4"/> GitHub
              </a>
              <a href="https://in.linkedin.com/in/onkardeokate" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="contact-linkedin">
                <Linkedin className="w-4 h-4"/> LinkedIn
              </a>
              <a href="https://dev.to/onkardeokate" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="contact-blog">
                <BookOpen className="w-4 h-4"/> Blog
              </a>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <form onSubmit={submit} className="border border-border p-6 md:p-8 bg-card space-y-4" data-testid="contact-form">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Your name" required>
                <input className="input-tech" required value={form.name} onChange={upd("name")} placeholder="Ada Lovelace" data-testid="contact-name"/>
              </Field>
              <Field label="Email" required>
                <input className="input-tech" required type="email" value={form.email} onChange={upd("email")} placeholder="ada@company.com" data-testid="contact-email"/>
              </Field>
            </div>
            <Field label="Company (optional)">
              <input className="input-tech" value={form.company} onChange={upd("company")} placeholder="Acme Corp" data-testid="contact-company"/>
            </Field>
            <Field label="Message" required>
              <textarea className="input-tech min-h-[140px]" required rows={6} value={form.message} onChange={upd("message")} placeholder="Tell me what you're trying to solve..." data-testid="contact-message"/>
            </Field>
            {state.err && <div className="text-primary text-xs font-mono" data-testid="contact-error">! {state.err}</div>}
            {state.ok && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm border border-emerald-800 bg-emerald-950/40 px-3 py-2" data-testid="contact-success">
                <Check className="w-4 h-4"/> Message received — I'll get back to you soon.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button disabled={state.loading} className="btn-primary flex items-center gap-2" data-testid="contact-submit">
                {state.loading ? "Sending..." : <>Send message <Send className="w-4 h-4"/></>}
              </button>
            </div>
          </form>
        </div>
      </section>
    </MarketingLayout>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}{required && <span className="text-primary"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function ContactItem({ icon: Icon, label, children }) {
  return (
    <div className="border-l-2 border-primary pl-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}
