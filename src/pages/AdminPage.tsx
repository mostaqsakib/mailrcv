import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AdminPage = () => {
  const [versionCode, setVersionCode] = useState("");
  const [versionName, setVersionName] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!versionCode || !versionName || !adminKey) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("update-app-version", {
        body: {
          admin_key: adminKey,
          version_code: parseInt(versionCode),
          version_name: versionName,
          release_notes: releaseNotes || null,
          is_force_update: isForceUpdate,
          download_url: "https://github.com/Digitaliz/mailrcv/releases/latest",
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Version Updated!",
          description: `Version ${versionName} (${versionCode}) has been published`,
        });
        // Clear form
        setVersionCode("");
        setVersionName("");
        setReleaseNotes("");
        setIsForceUpdate(false);
      } else {
        throw new Error(data?.error || "Failed to update version");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update version",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pt-safe pb-safe">
      <div className="max-w-md mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Publish New Version
            </CardTitle>
            <CardDescription>
              Update the app version after uploading APK to GitHub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminKey">Admin Key *</Label>
                <Input
                  id="adminKey"
                  type="password"
                  placeholder="Enter admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="versionCode">Version Code *</Label>
                  <Input
                    id="versionCode"
                    type="number"
                    placeholder="e.g. 5"
                    value={versionCode}
                    onChange={(e) => setVersionCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="versionName">Version Name *</Label>
                  <Input
                    id="versionName"
                    type="text"
                    placeholder="e.g. 1.0.5"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseNotes">Release Notes</Label>
                <Textarea
                  id="releaseNotes"
                  placeholder="What's new in this version..."
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="forceUpdate">Force Update</Label>
                  <p className="text-xs text-muted-foreground">
                    Users must update to continue
                  </p>
                </div>
                <Switch
                  id="forceUpdate"
                  checked={isForceUpdate}
                  onCheckedChange={setIsForceUpdate}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Publish Version
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          This page is for admin use only
        </p>
      </div>
    </div>
  );
};

export default AdminPage;
