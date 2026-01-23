import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, ArrowLeft, FileUp, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AdminPage = () => {
  
  const [releaseNotes, setReleaseNotes] = useState("");
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    version_code: number;
    version_name: string;
    file_name: string;
    download_url: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.apk')) {
        toast({
          title: "Invalid File",
          description: "Please select an APK file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !adminKey) {
      toast({
        title: "Missing Fields",
        description: "Please select an APK file and enter admin key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("admin_key", adminKey);
      formData.append("apk_file", selectedFile);
      formData.append("release_notes", releaseNotes || "");
      formData.append("is_force_update", isForceUpdate.toString());

      const { data, error } = await supabase.functions.invoke("upload-apk", {
        body: formData,
      });

      if (error) throw error;

      if (data?.success) {
        setUploadResult(data.data);
        toast({
          title: "✅ APK Uploaded!",
          description: `${data.data.file_name} uploaded successfully`,
        });
        // Clear form
        setSelectedFile(null);
        setReleaseNotes("");
        setIsForceUpdate(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(data?.error || "Failed to upload APK");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload APK",
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
              Upload APK and publish new version automatically
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

              <div className="space-y-2">
                <Label htmlFor="apkFile">APK File *</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    id="apkFile"
                    type="file"
                    accept=".apk"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <FileUp className="w-5 h-5" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <FileUp className="w-8 h-8 mx-auto mb-2" />
                      <p>Click to select APK file</p>
                      <p className="text-xs mt-1">Any filename works - will be renamed automatically</p>
                    </div>
                  )}
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

              <Button type="submit" className="w-full" disabled={isLoading || !selectedFile}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Publish
                  </>
                )}
              </Button>
            </form>

            {uploadResult && (
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Upload Successful!</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">File:</span> {uploadResult.file_name}</p>
                  <p><span className="text-muted-foreground">Version:</span> {uploadResult.version_name} (Code: {uploadResult.version_code})</p>
                  <p className="break-all">
                    <span className="text-muted-foreground">URL:</span>{" "}
                    <a href={uploadResult.download_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {uploadResult.download_url}
                    </a>
                  </p>
                </div>
              </div>
            )}
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
