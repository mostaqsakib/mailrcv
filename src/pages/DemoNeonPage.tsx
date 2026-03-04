import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Shield, Lock, Globe, Layers, Zap, ArrowRight, Sparkles } from "lucide-react";

const DemoNeonPage = () => {
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
    <div className="min-h-screen" style={{ background: "#06080f" }}>
      {/* Animated grid background */}
      <div className="fixed inset-0 opacity-[0.07]" style={{
        backgroundImage: `linear-gradient(rgba(0, 229, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.3) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      {/* Glow orbs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20" style={{
        background: "radial-gradient(circle, #00e5ff 0%, transparent 70%)",
        filter: "blur(80px)",
      }} />
      <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full opacity-15" style={{
        background: "radial-gradient(circle, #39ff14 0%, transparent 70%)",
        filter: "blur(80px)",
      }} />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00e5ff, #39ff14)" }}>
            <Mail className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: "#e0f7fa", fontFamily: "'JetBrains Mono', monospace" }}>MailRCV</span>
        </div>
        <button 
          onClick={() => navigate("/")}
          className="text-sm px-4 py-2 rounded-lg border transition-all hover:bg-white/5"
          style={{ borderColor: "rgba(0, 229, 255, 0.3)", color: "#00e5ff" }}
        >
          ← Back to Site
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-8" style={{
          background: "rgba(0, 229, 255, 0.08)",
          border: "1px solid rgba(0, 229, 255, 0.2)",
          color: "#00e5ff",
        }}>
          <Sparkles className="w-3 h-3" />
          CONCEPT: MIDNIGHT NEON
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] mb-6" style={{
          fontFamily: "'JetBrains Mono', monospace",
          background: "linear-gradient(135deg, #ffffff 30%, #00e5ff 60%, #39ff14 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Disposable
          <br />
          Email In
          <br />
          <span style={{ WebkitTextFillColor: "#00e5ff" }}>Seconds_</span>
        </h1>

        <p className="text-base sm:text-lg max-w-md mb-10 leading-relaxed" style={{ color: "rgba(224, 247, 250, 0.5)" }}>
          Create instant, anonymous email inboxes. No signup. No trace. Just privacy.
        </p>

        {/* Input */}
        <div className="w-full max-w-md relative group">
          <div className="absolute -inset-[2px] rounded-xl opacity-60 group-focus-within:opacity-100 transition-opacity" style={{
            background: "linear-gradient(135deg, #00e5ff, #39ff14)",
            filter: "blur(4px)",
          }} />
          <div className="relative flex items-center rounded-xl overflow-hidden" style={{ background: "#0d1117" }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="enter username"
              className="flex-1 px-5 py-4 bg-transparent text-white placeholder:text-gray-600 outline-none text-base"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            <span className="text-sm pr-2" style={{ color: "rgba(0, 229, 255, 0.4)", fontFamily: "'JetBrains Mono', monospace" }}>@mailrcv.site</span>
            <button className="m-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-black flex items-center gap-2 transition-all hover:brightness-110" style={{
              background: "linear-gradient(135deg, #00e5ff, #39ff14)",
            }}>
              Go <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12" style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "#e0f7fa",
        }}>
          // <span style={{ color: "#00e5ff" }}>features</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-6 rounded-xl border transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                background: "rgba(13, 17, 23, 0.8)",
                borderColor: "rgba(0, 229, 255, 0.1)",
                backdropFilter: "blur(20px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 229, 255, 0.4)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 229, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 229, 255, 0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{
                background: "rgba(0, 229, 255, 0.1)",
                color: "#00e5ff",
              }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(224, 247, 250, 0.4)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {[
            { val: "10K+", label: "Inboxes Created" },
            { val: "50K+", label: "Emails Received" },
            { val: "99.9%", label: "Uptime" },
          ].map((s, i) => (
            <div key={i} className="text-center p-6 rounded-xl border" style={{
              background: "rgba(13, 17, 23, 0.6)",
              borderColor: "rgba(57, 255, 20, 0.1)",
            }}>
              <div className="text-3xl sm:text-4xl font-black mb-1" style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "#39ff14",
              }}>{s.val}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "rgba(224, 247, 250, 0.3)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-10 text-center" style={{ borderTop: "1px solid rgba(0, 229, 255, 0.1)" }}>
        <p className="text-xs" style={{ color: "rgba(224, 247, 250, 0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
          concept // midnight_neon — mailrcv.site
        </p>
      </footer>
    </div>
  );
};

export default DemoNeonPage;
