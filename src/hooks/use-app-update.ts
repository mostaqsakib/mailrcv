import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// GitHub repository for releases
const GITHUB_REPO = 'mostaqsakib/mailrcv';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// Fallback constants for web preview
export const CURRENT_VERSION_CODE = 1;
export const CURRENT_VERSION_NAME = '1.0.0';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

interface AppVersion {
  version_code: number;
  version_name: string;
  release_notes: string | null;
  download_url: string | null;
  is_force_update: boolean;
}

/**
 * Parse version string like "1.0.80" into a comparable number (e.g., 1000080)
 */
function parseVersionToNumber(version: string): number {
  const parts = version.replace(/^v/, '').split('.').map(Number);
  // major * 1000000 + minor * 1000 + patch
  return (parts[0] || 0) * 1000000 + (parts[1] || 0) * 1000 + (parts[2] || 0);
}

/**
 * Extract version code (build number) from release body if present
 * Looks for pattern like "Build #80" or "(Build #80)"
 */
function extractVersionCode(body: string): number | null {
  const match = body.match(/Build\s*#(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if release notes indicate a force update
 * Convention: Include "[FORCE]" or "[FORCE UPDATE]" in release body
 */
function isForceUpdate(body: string): boolean {
  return /\[FORCE(?:\s*UPDATE)?\]/i.test(body);
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

        console.log('[update] native App.getInfo()', { version: info.version, build: info.build });
      } catch (err) {
        console.warn('Failed to read native app version info; falling back to constants.', err);
      } finally {
        setIsNativeVersionResolved(true);
      }
    };

    loadNativeVersion();
  }, []);

  const checkForUpdate = async () => {
    // Prevent check while native version is loading
    if (Capacitor.isNativePlatform() && !isNativeVersionResolved) return;

    setIsChecking(true);
    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        console.error('GitHub API error:', response.status);
        return;
      }

      const release: GitHubRelease = await response.json();
      
      // Extract version from tag (e.g., "v1.0.80" -> "1.0.80")
      const latestVersionName = release.tag_name.replace(/^v/, '');
      
      // Try to get version code from release body, fallback to parsing version name
      const latestVersionCode = extractVersionCode(release.body || '') 
        || parseVersionToNumber(latestVersionName);
      
      // Find APK download URL
      const apkAsset = release.assets.find(a => a.name.endsWith('.apk'));
      const downloadUrl = apkAsset?.browser_download_url || release.html_url;

      const appVersion: AppVersion = {
        version_code: latestVersionCode,
        version_name: latestVersionName,
        release_notes: release.body || null,
        download_url: downloadUrl,
        is_force_update: isForceUpdate(release.body || ''),
      };

      setLatestVersion(appVersion);

      // Compare versions
      const installedVersionNum = parseVersionToNumber(currentVersionName);
      const latestVersionNum = parseVersionToNumber(latestVersionName);

      console.log('[update] compare', {
        installed: { version_name: currentVersionName, version_code: currentVersionCode, parsed: installedVersionNum },
        latest: { version_name: latestVersionName, version_code: latestVersionCode, parsed: latestVersionNum },
      });

      // Only show update if latest is strictly newer
      if (latestVersionNum > installedVersionNum) {
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false);
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
    const url = latestVersion?.download_url || `https://github.com/${GITHUB_REPO}/releases/latest`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    // Check for updates on mount (after native version is resolved)
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
    currentVersionCode,
  };
};
