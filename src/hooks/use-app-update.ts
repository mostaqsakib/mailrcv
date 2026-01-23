import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Current app version - increment this when releasing new APK
export const CURRENT_VERSION_CODE = 1;
export const CURRENT_VERSION_NAME = '1.0.0';

interface AppVersion {
  version_code: number;
  version_name: string;
  release_notes: string | null;
  download_url: string | null;
  is_force_update: boolean;
}

export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdate = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('app_version')
        .select('version_code, version_name, release_notes, download_url, is_force_update')
        .order('version_code', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error checking for updates:', error);
        return;
      }

      if (data && data.version_code > CURRENT_VERSION_CODE) {
        setUpdateAvailable(true);
        setLatestVersion(data);
      }
    } catch (err) {
      console.error('Update check failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const dismissUpdate = () => {
    if (latestVersion?.is_force_update) {
      // Can't dismiss force updates
      return;
    }
    setUpdateAvailable(false);
  };

  const goToDownload = () => {
    const url = latestVersion?.download_url || 'https://mailrcv.site/download';
    window.open(url, '_blank');
  };

  useEffect(() => {
    // Check for updates on mount
    checkForUpdate();
  }, []);

  return {
    updateAvailable,
    latestVersion,
    isChecking,
    checkForUpdate,
    dismissUpdate,
    goToDownload,
    currentVersion: CURRENT_VERSION_NAME,
  };
};
