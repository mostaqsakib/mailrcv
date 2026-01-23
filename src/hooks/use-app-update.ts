import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

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
  const [currentVersionCode, setCurrentVersionCode] = useState<number>(CURRENT_VERSION_CODE);
  const [currentVersionName, setCurrentVersionName] = useState<string>(CURRENT_VERSION_NAME);
  const [isNativeVersionResolved, setIsNativeVersionResolved] = useState<boolean>(
    !Capacitor.isNativePlatform()
  );

  useEffect(() => {
    // On native builds, read the real installed version/build number.
    // This avoids having to keep CURRENT_VERSION_* in sync manually.
    const loadNativeVersion = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        const info = await App.getInfo();
        const buildNumber = Number(info.build);
        if (Number.isFinite(buildNumber) && buildNumber > 0) {
          setCurrentVersionCode(buildNumber);
        }
        if (info.version) {
          setCurrentVersionName(info.version);
        }
      } catch (err) {
        console.warn('Failed to read native app version info; falling back to constants.', err);
      } finally {
        setIsNativeVersionResolved(true);
      }
    };

    loadNativeVersion();
  }, []);

  const checkForUpdate = async () => {
    // Prevent a false-positive update prompt on native while we haven't loaded
    // the real installed build/version yet.
    if (Capacitor.isNativePlatform() && !isNativeVersionResolved) return;

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

      if (!data) return;

      // If the installed app already matches the latest release (by name OR build code),
      // do not show any update prompt.
      const isSameVersionName =
        Boolean(currentVersionName) && data.version_name === currentVersionName;
      const isSameVersionCode = data.version_code === currentVersionCode;
      if (isSameVersionName || isSameVersionCode) {
        setUpdateAvailable(false);
        setLatestVersion(data);
        return;
      }

      // Only show prompt when backend version is strictly newer than installed app.
      if (data.version_code > currentVersionCode) {
        setUpdateAvailable(true);
        setLatestVersion(data);
      } else {
        setUpdateAvailable(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVersionCode, isNativeVersionResolved]);

  return {
    updateAvailable,
    latestVersion,
    isChecking,
    isReady: isNativeVersionResolved,
    checkForUpdate,
    dismissUpdate,
    goToDownload,
    currentVersion: currentVersionName,
  };
};
