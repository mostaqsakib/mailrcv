import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Domain {
  id: string;
  domain_name: string;
  is_verified: boolean;
}

// Default domains (always available as fallback)
const DEFAULT_DOMAINS = ["mailrcv.site", "getemail.cfd"];

export const useDomains = () => {
  const [domains, setDomains] = useState<string[]>(DEFAULT_DOMAINS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchDomains = async () => {
      try {
        const { data, error } = await supabase
          .from('domains')
          .select('domain_name')
          .eq('is_verified', true)
          .order('created_at', { ascending: true });
        
        if (!error && data && data.length > 0) {
          const dbDomains = data.map(d => d.domain_name);
          // Use DB domains, ensuring defaults are included
          const allDomains = [...new Set([...dbDomains, ...DEFAULT_DOMAINS])];
          setDomains(allDomains);
        }
      } catch (err) {
        console.error('Error fetching domains:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();

    // Realtime subscription for domain changes
    const channel = supabase
      .channel('domains-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domains'
        },
        (payload) => {
          console.log('Domain change:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newDomain = payload.new as Domain;
            if (newDomain.is_verified) {
              setDomains(prev => {
                if (prev.includes(newDomain.domain_name)) return prev;
                return [...prev, newDomain.domain_name];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const oldDomain = payload.old as Domain;
            // Don't remove default domains
            if (!DEFAULT_DOMAINS.includes(oldDomain.domain_name)) {
              setDomains(prev => prev.filter(d => d !== oldDomain.domain_name));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { domains, loading };
};
