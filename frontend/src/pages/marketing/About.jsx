import { Link } from "react-router-dom";
import { Mail, Github, Linkedin, BookOpen, MapPin, ArrowRight } from "lucide-react";
import MarketingLayout from "../../components/marketing/MarketingLayout";

/**
 * TODO(owner): Replace the placeholder personal details below with your real info.
 * Search for the string PLACEHOLDER: to find them all at a glance.
 */
export default function About() {
  return (
    <MarketingLayout>
      <section className="px-6 md:px-16 pt-16 pb-16 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-7">
          <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// about</div>
          <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] mb-6">
            Built by a CRM operator<br />who was <span className="text-primary">tired of the noise.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            Hi — I'm <span className="text-foreground font-semibold">Onkar Deokate</span>, the founder of Company/OS. I've worked in the trenches of CRM operations for
            years and kept watching agents drown in tabs, miss escalations, and re-onboard the
            same questions over and over. Company/OS is my answer: an operating system that reads
            your team's playbooks, respects each person's data boundaries, and just answers.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <a href="mailto:tylordyron@gmail.com" className="btn-primary flex items-center gap-2" data-testid="about-cta-email">
              <Mail className="w-4 h-4" /> Say hi
            </a>
            <Link to="/contact" className="btn-ghost">Send a longer message →</Link>
          </div>

          <div className="mt-10 pt-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <a href="mailto:tylordyron@gmail.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="about-email">
              <Mail className="w-4 h-4"/> Email
            </a>
            <a href="https://in.linkedin.com/in/onkardeokate" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="about-linkedin">
              <Linkedin className="w-4 h-4"/> LinkedIn
            </a>
            <a href="https://github.com/Deonkar" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="about-github">
              <Github className="w-4 h-4"/> GitHub
            </a>
            <a href="https://dev.to/onkardeokate" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="about-blog">
              <BookOpen className="w-4 h-4"/> Blog
            </a>
          </div>
        </div>

        <aside className="md:col-span-5">
          <div className="border border-border bg-card p-6 md:p-8">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">/// snapshot</div>
            <dl className="space-y-4 text-sm">
              <SnapItem label="Founder">Onkar Deokate</SnapItem>
              <SnapItem label="Role">CRM ops · builder of Company/OS</SnapItem>
              <SnapItem label="Based in">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary"/>Bangalore, India</span>
              </SnapItem>
              <SnapItem label="Building since">2026</SnapItem>
              <SnapItem label="Powered by">Emergent · Claude Sonnet 4.6 · Whisper</SnapItem>
            </dl>
          </div>

          <div className="border border-border bg-card p-6 md:p-8 mt-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">/// company/os in one line</div>
            <p className="font-display font-bold text-xl leading-tight">
              The plug-and-play operating system that turns your team's markdown, code, and CRM data
              into one privacy-scoped chatbot.
            </p>
          </div>
        </aside>
      </section>

      <section className="px-6 md:px-16 py-16 border-t border-border">
        <div className="max-w-3xl">
          <h2 className="font-display font-black text-3xl md:text-4xl mb-6">Why this exists.</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>Every mid-sized ops team has the same problem: too many tools, too little institutional memory. The docs live in one place, the CRM in another, the Slack threads nowhere.</p>
            <p>The result: agents spend minutes hunting for what should be one sentence, escalations sneak past, and new hires ask the same six questions for a month.</p>
            <p>Company/OS collapses that into a single chat surface — but scoped correctly so it never leaks data across roles or agents.</p>
          </div>
          <div className="mt-8">
            <Link to="/register" className="btn-primary flex items-center gap-2 w-fit" data-testid="about-cta-register">
              Register now <ArrowRight className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function SnapItem({ label, children }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
