import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Shield, Lock, Globe, Layers, Zap, ArrowRight, Sparkles } from "lucide-react";

const DemoAuroraPage = () => {
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
    <div className="min-h-screen relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 30%, #24243e 50%, #0f3460 100%)",
    }}>
      {/* Aurora mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-20" style={{
          background: "radial-gradient(ellipse, #a855f7 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "float 15s ease-in-out infinite",
        }} />
        <div className="absolute top-[10%] right-[-20%] w-[60%] h-[60%] rounded-full opacity-15" style={{
          background: "radial-gradient(ellipse, #ec4899 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "float 20s ease-in-out infinite reverse",
        }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full opacity-15" style={{
          background: "radial-gradient(ellipse, #f97316 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "float 18s ease-in-out infinite",
        }} />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: "linear-gradient(135deg, #a855f7, #ec4899, #f97316)",
          }}>
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">MailRCV</span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-sm px-4 py-2 rounded-xl text-white/50 hover:text-white/80 transition-colors backdrop-blur-sm border border-white/10 hover:border-white/20"
        >
          ← Back to Site
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-10" style={{
          background: "rgba(168, 85, 247, 0.15)",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          color: "#c084fc",
          backdropFilter: "blur(10px)",
        }}>
          <Sparkles className="w-3 h-3" />
          CONCEPT: AURORA
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.03em] leading-[1] mb-6">
          <span className="text-white">Disposable Email</span>
          <br />
          <span className="mt-2 inline-block" style={{
            background: "linear-gradient(135deg, #a855f7 0%, #ec4899 40%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>In Seconds</span>
        </h1>

        <p className="text-base sm:text-lg text-white/40 max-w-md mb-12 leading-relaxed">
          Create instant, anonymous email inboxes. No signup. No trace. Just privacy.
        </p>

        {/* Glass input */}
        <div className="w-full max-w-md relative">
          {/* Gradient border glow */}
          <div className="absolute -inset-[1px] rounded-2xl opacity-70" style={{
            background: "linear-gradient(135deg, #a855f7, #ec4899, #f97316)",
            filter: "blur(3px)",
          }} />
          <div className="relative flex items-center rounded-2xl overflow-hidden" style={{
            background: "rgba(15, 12, 41, 0.85)",
            backdropFilter: "blur(20px)",
          }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="enter username"
              className="flex-1 px-5 py-4 bg-transparent text-white placeholder:text-white/20 outline-none text-base"
            />
            <span className="text-sm text-white/25 pr-1">@mailrcv.site</span>
            <button className="m-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-2 transition-all hover:brightness-110" style={{
              background: "linear-gradient(135deg, #a855f7, #ec4899)",
            }}>
              Go <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-center mb-12">
          <span className="text-2xl font-bold" style={{
            background: "linear-gradient(135deg, #c084fc, #f472b6, #fb923c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Features</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderColor: "rgba(255, 255, 255, 0.06)",
                backdropFilter: "blur(20px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)";
                e.currentTarget.style.boxShadow = "0 8px 40px rgba(168, 85, 247, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))",
                color: "#c084fc",
              }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
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
            <div key={i} className="text-center p-6 rounded-2xl" style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(20px)",
            }}>
              <div className="text-3xl sm:text-4xl font-extrabold mb-1" style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>{s.val}</div>
              <div className="text-xs uppercase tracking-widest text-white/25">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-10 text-center" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <p className="text-xs text-white/15">
          concept · aurora — mailrcv.site
        </p>
      </footer>
    </div>
  );
};

export default DemoAuroraPage;
