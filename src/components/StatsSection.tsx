import { useEffect, useState, useRef } from "react";
import { Mail, Inbox, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalInboxes: number;
  totalEmails: number;
  activeToday: number;
}

// Custom hook for count-up animation
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
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);

      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [end, duration, isLoading]);

  return count;
};

// Animated number component
const AnimatedNumber = ({ value, isLoading }: { value: number; isLoading: boolean }) => {
  const animatedValue = useCountUp(value, 2000, isLoading);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (isLoading) {
    return <div className="h-10 w-20 mx-auto bg-muted/30 rounded animate-pulse" />;
  }

  return <span className="gradient-text">{formatNumber(animatedValue)}</span>;
};

export const StatsSection = () => {
  const [stats, setStats] = useState<Stats>({
    totalInboxes: 0,
    totalEmails: 0,
    activeToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection observer for triggering animation when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: inboxCount } = await supabase
          .from("email_aliases")
          .select("*", { count: "exact", head: true });

        const { count: emailCount } = await supabase
          .from("received_emails")
          .select("*", { count: "exact", head: true });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: activeCount } = await supabase
          .from("email_aliases")
          .select("*", { count: "exact", head: true })
          .gte("updated_at", today.toISOString());

        setStats({
          totalInboxes: inboxCount || 0,
          totalEmails: emailCount || 0,
          activeToday: activeCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    {
      icon: Inbox,
      value: stats.totalInboxes,
      label: "Inboxes Created",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Mail,
      value: stats.totalEmails,
      label: "Emails Received",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: TrendingUp,
      value: stats.activeToday,
      label: "Active Today",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 bg-background relative overflow-hidden">
      <div className="container relative z-10 px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            📊 Live Stats
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {statsData.map((stat, index) => (
            <div
              key={stat.label}
              className="group text-center p-6 rounded-2xl glass hover:glow transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">
                <AnimatedNumber value={isVisible ? stat.value : 0} isLoading={isLoading} />
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
