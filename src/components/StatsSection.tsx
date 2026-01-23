import { useEffect, useState } from "react";
import { Users, Mail, Inbox, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalInboxes: number;
  totalEmails: number;
  activeToday: number;
}

export const StatsSection = () => {
  const [stats, setStats] = useState<Stats>({
    totalInboxes: 0,
    totalEmails: 0,
    activeToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total inboxes count
        const { count: inboxCount } = await supabase
          .from("email_aliases")
          .select("*", { count: "exact", head: true });

        // Get total emails count
        const { count: emailCount } = await supabase
          .from("received_emails")
          .select("*", { count: "exact", head: true });

        // Get active inboxes today
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statsData = [
    {
      icon: Inbox,
      value: formatNumber(stats.totalInboxes),
      label: "Inboxes Created",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Mail,
      value: formatNumber(stats.totalEmails),
      label: "Emails Received",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: TrendingUp,
      value: formatNumber(stats.activeToday),
      label: "Active Today",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-background relative overflow-hidden">
      <div className="container relative z-10 px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by thousands
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
                {isLoading ? (
                  <div className="h-10 w-20 mx-auto bg-muted/30 rounded animate-pulse" />
                ) : (
                  <span className="gradient-text">{stat.value}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
