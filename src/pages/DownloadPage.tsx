import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const GITHUB_REPO = "mostaqsakib/mailrcv";
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

const DownloadPage = () => {
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLatestAPK = async () => {
      try {
        // Fetch latest release from GitHub API to get direct APK link
        const response = await fetch(GITHUB_API_URL, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          // Fallback to releases page
          window.location.href = GITHUB_RELEASES_URL;
          return;
        }

        const release = await response.json();
        
        // Find APK asset
        const apkAsset = release.assets?.find((a: any) => a.name.endsWith('.apk'));
        
        if (apkAsset?.browser_download_url) {
          // Redirect directly to APK download
          window.location.href = apkAsset.browser_download_url;
        } else {
          // No APK found, redirect to releases page
          window.location.href = GITHUB_RELEASES_URL;
        }
      } catch {
        setError(true);
      }
    };

    fetchLatestAPK();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-safe pb-safe">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Download Error</h1>
          <p className="text-muted-foreground">
            Try downloading from{" "}
            <a 
              href={GITHUB_RELEASES_URL}
              className="text-primary hover:underline"
            >
              GitHub Releases
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-safe pb-safe">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Starting Download...</h1>
        <p className="text-muted-foreground">
          If download doesn't start,{" "}
          <a 
            href={GITHUB_RELEASES_URL}
            className="text-primary hover:underline"
          >
            click here
          </a>
        </p>
      </div>
    </div>
  );
};

export default DownloadPage;
