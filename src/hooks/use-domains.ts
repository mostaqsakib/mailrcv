import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Domain {
  id: string;
  domain_name: string;
  is_verified: boolean;
}

// Default domains (always available as fallback)
const DEFAULT_DOMAINS = ["mailrcv.site", "getemail.cfd"];

// Module-level cache so domains persist across navigations
let cachedDomains: string[] | null = null;
let fetchPromise: Promise<void> | null = null;

const fetchAndCacheDomains = async (setDomains: (d: string[]) => void) => {
  if (cachedDomains) {
    setDomains(cachedDomains);
    return;
  }

  if (!fetchPromise) {
    fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('domains')
          .select('domain_name')
          .eq('is_verified', true)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const dbDomains = data.map(d => d.domain_name);
          cachedDomains = [...new Set([...dbDomains, ...DEFAULT_DOMAINS])];
        } else {
          cachedDomains = DEFAULT_DOMAINS;
        }
      } catch {
        cachedDomains = DEFAULT_DOMAINS;
      } finally {
        fetchPromise = null;
      }
    })();
  }

  await fetchPromise;
  if (cachedDomains) setDomains(cachedDomains);
};

export const useDomains = () => {
  const [domains, setDomains] = useState<string[]>(cachedDomains || DEFAULT_DOMAINS);
  const [loading, setLoading] = useState(!cachedDomains);

  useEffect(() => {
    fetchAndCacheDomains((d) => {
      setDomains(d);
      setLoading(false);
    });

    const channel = supabase
      .channel('domains-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domains' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newDomain = payload.new as Domain;
            if (newDomain.is_verified) {
              setDomains(prev => {
                if (prev.includes(newDomain.domain_name)) return prev;
                const updated = [...prev, newDomain.domain_name];
                cachedDomains = updated;
                return updated;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const oldDomain = payload.old as Domain;
            if (!DEFAULT_DOMAINS.includes(oldDomain.domain_name)) {
              setDomains(prev => {
                const updated = prev.filter(d => d !== oldDomain.domain_name);
                cachedDomains = updated;
                return updated;
              });
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
