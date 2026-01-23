import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List files in the apk-downloads bucket to find the latest APK
    const { data: files, error: listError } = await supabase
      .storage
      .from('apk-downloads')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    console.log("Files in bucket:", files);

    if (listError) {
      console.error("Error listing files:", listError);
      return new Response(
        JSON.stringify({ error: "Could not list APK files", details: listError.message }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Find the first APK file
    const apkFile = files?.find(file => file.name.endsWith('.apk'));

    if (!apkFile) {
      console.log("No APK file found in storage");
      return new Response(
        JSON.stringify({ 
          error: "No APK available yet",
          message: "Please upload an APK file to the storage bucket"
        }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get the public URL for the APK
    const { data: urlData } = supabase
      .storage
      .from('apk-downloads')
      .getPublicUrl(apkFile.name);

    console.log("Redirecting to APK:", urlData.publicUrl);

    // Redirect to the APK download URL
    return new Response(null, {
      status: 302,
      headers: {
        "Location": urlData.publicUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Download failed", details: String(error) }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});