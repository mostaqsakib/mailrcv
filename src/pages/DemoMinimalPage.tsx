import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Shield, Lock, Globe, Layers, Zap, ArrowRight, Sparkles } from "lucide-react";

const DemoMinimalPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const features = [
    { icon: <Zap className="w-5 h-5" />, title: "Instant Inbox", desc: "Create a disposable email in one click. No signup needed." },
    { icon: <Lock className="w-5 h-5" />, title: "Password Protected", desc: "Lock your inbox with a password for extra security." },
    { icon: <Shield className="w-5 h-5" />, title: "Privacy First", desc: "No tracking. No ads. Your data stays yours." },
    { icon: <Globe className="w-5 h-5" />, title: "Custom Domains", desc: "Use your own domain for a professional touch." },
    { icon: <Layers className="w-5 h-5" />, title: "Bulk Generate", desc: "Create multiple inboxes at once for power users." },
    { icon: <Mail className="w-5 h-5" />, title: "Real-time Updates", desc: "Emails arrive instantly with live notifications." },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#111113]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#111113] dark:bg-white flex items-center justify-center">
            <Mail className="w-4 h-4 text-white dark:text-[#111113]" />
          </div>
          <span className="text-base font-semibold tracking-tight text-[#111113] dark:text-white">MailRCV</span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-sm px-4 py-2 rounded-lg text-[#666] dark:text-[#888] hover:text-[#111] dark:hover:text-white transition-colors"
        >
          ← Back to Site
        </button>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <Sparkles className="w-3 h-3" />
          CONCEPT: CLEAN SLATE
        </div>

        <h1 className="text-5xl sm:text-[4.5rem] font-extrabold tracking-[-0.04em] leading-[1] mb-6 text-[#111113] dark:text-white">
          Disposable email,
          <br />
          <span className="text-emerald-500">simplified.</span>
        </h1>

        <p className="text-lg text-[#666] dark:text-[#888] max-w-md mb-12 leading-relaxed">
          Instant anonymous inboxes. No signup required. Just type a username and go.
        </p>

        {/* Input */}
        <div className="w-full max-w-md">
          <div className="flex items-center rounded-2xl border-2 border-[#e5e5e5] dark:border-[#2a2a2e] bg-white dark:bg-[#1a1a1e] focus-within:border-emerald-500 dark:focus-within:border-emerald-500 transition-colors shadow-sm">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="flex-1 px-5 py-4 bg-transparent text-[#111] dark:text-white placeholder:text-[#ccc] dark:placeholder:text-[#555] outline-none text-base"
            />
            <span className="text-sm text-[#bbb] dark:text-[#555] pr-1">@mailrcv.site</span>
            <button className="m-1.5 px-5 py-2.5 rounded-xl bg-[#111113] dark:bg-white text-white dark:text-[#111] font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
              Go <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-[#eee] dark:bg-[#222]" />
      </div>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[#999] dark:text-[#666] text-center mb-14">
          Why MailRCV
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-7 rounded-2xl transition-colors hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1e]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                {f.icon}
              </div>
              <h3 className="font-semibold text-[#111] dark:text-white mb-2 text-[15px]">{f.title}</h3>
              <p className="text-sm text-[#888] dark:text-[#666] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-[#eee] dark:bg-[#222]" />
      </div>

      {/* Stats */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-8">
          {[
            { val: "10K+", label: "Inboxes Created" },
            { val: "50K+", label: "Emails Received" },
            { val: "99.9%", label: "Uptime" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111] dark:text-white mb-2">{s.val}</div>
              <div className="text-xs uppercase tracking-widest text-[#aaa] dark:text-[#555]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center border-t border-[#eee] dark:border-[#222]">
        <p className="text-xs text-[#ccc] dark:text-[#444]">
          concept · clean slate — mailrcv.site
        </p>
      </footer>
    </div>
  );
};

export default DemoMinimalPage;
