import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const adminKey = formData.get("admin_key") as string;
    const apkFile = formData.get("apk_file") as File;
    const versionName = formData.get("version_name") as string;
    const releaseNotes = formData.get("release_notes") as string | null;
    const isForceUpdate = formData.get("is_force_update") === "true";

    // Verify admin key
    const expectedKey = Deno.env.get("ADMIN_SECRET_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      console.error("Invalid admin key attempt");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid admin key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apkFile) {
      return new Response(
        JSON.stringify({ success: false, error: "No APK file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current version from database to auto-increment
    const { data: currentVersion, error: fetchError } = await supabase
      .from("app_version")
      .select("version_code")
      .order("version_code", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching current version:", fetchError);
      throw fetchError;
    }

    const newVersionCode = (currentVersion?.version_code || 0) + 1;
    const finalVersionName = versionName || `1.0.${newVersionCode}`;
    const fileName = `mailrcv-v${finalVersionName}.apk`;

    console.log(`Uploading APK: ${fileName} (version code: ${newVersionCode})`);

    // Upload APK to storage
    const arrayBuffer = await apkFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("apk-downloads")
      .upload(fileName, arrayBuffer, {
        contentType: "application/vnd.android.package-archive",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("apk-downloads")
      .getPublicUrl(fileName);

    const downloadUrl = urlData.publicUrl;

    console.log(`APK uploaded to: ${downloadUrl}`);

    // Update version in database
    const { data, error: dbError } = await supabase
      .from("app_version")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        version_code: newVersionCode,
        version_name: finalVersionName,
        release_notes: releaseNotes || null,
        is_force_update: isForceUpdate,
        download_url: downloadUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("Version updated successfully:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          version_code: newVersionCode,
          version_name: finalVersionName,
          download_url: downloadUrl,
          file_name: fileName,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error uploading APK:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
