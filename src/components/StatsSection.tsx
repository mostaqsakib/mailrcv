import { useEffect, useState, useRef, useCallback } from "react";
import { Mail, Inbox, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalInboxes: number;
  totalEmails: number;
  activeToday: number;
}

let cachedStats: Stats | null = null;

const useCountUp = (end: number, duration: number = 2000, isLoading: boolean) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading || end === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(end);
    };

    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [end, duration, isLoading]);

  return count;
};

const AnimatedNumber = ({ value, isLoading }: { value: number; isLoading: boolean }) => {
  const animatedValue = useCountUp(value, 2000, isLoading);
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };
  if (isLoading) return <div className="h-12 w-24 mx-auto bg-muted/20 rounded-lg animate-pulse" />;
  return <span className="gradient-text">{formatNumber(animatedValue)}</span>;
};

interface StatCardProps {
  stat: { icon: typeof Inbox; value: number; label: string; accent: string };
  index: number;
  isVisible: boolean;
  isLoading: boolean;
}

const StatCard = ({ stat, index, isVisible, isLoading }: StatCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const Icon = stat.icon;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-slide-up"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* Gradient border on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent 40%)`,
        }}
      />

      {/* Spotlight */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
          style={{
            background: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.1), transparent 60%)`,
          }}
        />
      )}

      {/* Card */}
      <div className="relative rounded-2xl p-8 h-full bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500 text-center">
        {/* Icon */}
        <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${stat.accent} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500`}>
          <Icon className="w-7 h-7 text-white" strokeWidth={2} />
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${stat.accent} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`} />
        </div>

        {/* Number */}
        <div className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
          <AnimatedNumber value={isVisible ? stat.value : 0} isLoading={isLoading} />
        </div>

        <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>

        {/* Bottom shine */}
        <div className="mt-6 h-[1px] w-full overflow-hidden rounded-full">
          <div
            className="h-full w-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:translate-x-full"
            style={{ background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)` }}
          />
        </div>
      </div>
    </div>
  );
};

export const StatsSection = () => {
  const [stats, setStats] = useState<Stats>(cachedStats || { totalInboxes: 0, totalEmails: 0, activeToday: 0 });
  const [isLoading, setIsLoading] = useState(!cachedStats);
  const [isVisible, setIsVisible] = useState(!!cachedStats);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchStats = async () => {
    try {
      const [inboxRes, emailRes, activeRes] = await Promise.all([
        supabase.from("email_aliases").select("*", { count: "exact", head: true }),
        supabase.from("received_emails").select("*", { count: "exact", head: true }),
        supabase.from("email_aliases").select("*", { count: "exact", head: true })
          .gte("updated_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      ]);
      const newStats = { totalInboxes: inboxRes.count || 0, totalEmails: emailRes.count || 0, activeToday: activeRes.count || 0 };
      cachedStats = newStats;
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (isVisible && isLoading) fetchStats(); }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const channel = supabase.channel('stats-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'email_aliases' }, () => fetchStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'received_emails' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isVisible]);

  const statsData = [
    { icon: Inbox, value: stats.totalInboxes, label: "Inboxes Created", accent: "from-sky-400 to-blue-500" },
    { icon: Mail, value: stats.totalEmails, label: "Emails Received", accent: "from-emerald-400 to-teal-500" },
    { icon: TrendingUp, value: stats.activeToday, label: "Active Today", accent: "from-violet-400 to-purple-500" },
  ];

  return (
    <section ref={sectionRef} className="py-8 sm:py-12 bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-15" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[180px] rounded-full" />

      <div className="container relative z-10 px-4">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Real-time Data
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            <span className="gradient-text">Live Stats</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {statsData.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} isVisible={isVisible} isLoading={isLoading} />
          ))}
        </div>
      </div>
    </section>
  );
};
