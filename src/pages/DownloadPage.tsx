import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const DownloadPage = () => {
  useEffect(() => {
    // Redirect to the GitHub releases page (not direct APK link)
    window.location.href = "https://github.com/Digitaliz/mailrcv/releases/latest";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-safe pb-safe">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Redirecting to Downloads...</h1>
        <p className="text-muted-foreground">
          If redirect doesn't work,{" "}
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
