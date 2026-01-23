import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const DownloadPage = () => {
  useEffect(() => {
    // Redirect to the edge function that handles APK download
    window.location.href = "https://euiqflvrdraydkhwksmh.supabase.co/functions/v1/download-apk";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-safe pb-safe">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Starting Download...</h1>
        <p className="text-muted-foreground">
          If download doesn't start automatically,{" "}
          <a 
            href="https://euiqflvrdraydkhwksmh.supabase.co/functions/v1/download-apk"
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