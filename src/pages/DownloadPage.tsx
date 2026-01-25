import { useState } from "react";
import { Download, Loader2, AlertCircle, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const DownloadPage = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      // Get the edge function URL
      const { data: { publicUrl } } = supabase.storage.from('temp').getPublicUrl('');
      const baseUrl = publicUrl.replace('/storage/v1/object/public/temp/', '');
      const downloadUrl = `${baseUrl}/functions/v1/download-apk`;

      // Trigger download by opening the URL
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'MailRCV.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadStarted(true);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to start download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-safe pb-safe">
      <div className="container max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Download MailRCV
          </h1>
          <p className="text-muted-foreground text-lg">
            Get instant email notifications on your Android device
          </p>
        </div>

        {/* Download Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get instant alerts when new emails arrive</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Secure & Private</p>
                <p className="text-sm text-muted-foreground">Your data stays on your device</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Always Updated</p>
                <p className="text-sm text-muted-foreground">Automatic updates keep you on the latest version</p>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            size="lg"
            className="w-full h-14 text-lg font-semibold"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Preparing Download...
              </>
            ) : downloadStarted ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Download Started!
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download APK
              </>
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {downloadStarted && !error && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary">
                Your download should start automatically. If it doesn't, click the button again.
              </p>
            </div>
          )}

          {/* Install Instructions */}
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-3">Installation Guide</h3>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                Download the APK file
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                Open the downloaded file
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                Allow installation from unknown sources if prompted
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">4.</span>
                Complete the installation
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Requires Android 7.0 or higher
        </p>
      </div>
    </div>
  );
};

export default DownloadPage;
