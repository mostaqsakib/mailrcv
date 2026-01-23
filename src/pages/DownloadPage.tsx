import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DownloadPage = () => {
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLatestAPK = async () => {
      try {
        const { data, error } = await supabase
          .from("app_version")
          .select("download_url, version_name")
          .order("version_code", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data?.download_url) {
          // Fallback to GitHub releases
          window.location.href = "https://github.com/Digitaliz/mailrcv/releases/latest";
          return;
        }

        // Redirect to the latest APK from storage
        window.location.href = data.download_url;
      } catch (err) {
        console.error("Error fetching APK:", err);
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
              href="https://github.com/Digitaliz/mailrcv/releases/latest"
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
            href="https://github.com/Digitaliz/mailrcv/releases/latest"
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
