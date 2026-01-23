import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the public URL for the APK (fixed filename from CI)
    const apkFileName = "mailrcv-latest.apk";
    
    const { data: urlData } = supabase
      .storage
      .from('apk-downloads')
      .getPublicUrl(apkFileName);

    // Check if file exists by trying to list it
    const { data: files, error: listError } = await supabase
      .storage
      .from('apk-downloads')
      .list('', { search: apkFileName });

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

    // Check if APK exists
    const apkExists = files?.some(file => file.name === apkFileName);

    if (!apkExists) {
      console.log("No APK file found in storage");
      return new Response(
        JSON.stringify({ 
          error: "No APK available yet",
          message: "APK will be available after the next CI build"
        }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

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