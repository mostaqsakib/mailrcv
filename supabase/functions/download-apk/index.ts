import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GITHUB_REPO = "mostaqsakib/mailrcv";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching latest release from GitHub API...");
    
    // Fetch latest release from GitHub
    const releaseResponse = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MailRCV-App',
      },
    });

    if (!releaseResponse.ok) {
      console.error("GitHub API error:", releaseResponse.status);
      return new Response(
        JSON.stringify({ 
          error: "Could not fetch release info",
          message: "Please try again later"
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const release = await releaseResponse.json();
    console.log("Release found:", release.tag_name);
    
    // Find APK asset
    const apkAsset = release.assets?.find((a: any) => a.name.endsWith('.apk'));
    
    if (!apkAsset) {
      console.log("No APK found in release");
      return new Response(
        JSON.stringify({ 
          error: "No APK available",
          message: "APK will be available after the next build"
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("APK found:", apkAsset.name, "Size:", apkAsset.size);
    
    // Stream the APK directly from GitHub through our edge function
    // This hides the GitHub URL from the user
    const apkResponse = await fetch(apkAsset.browser_download_url, {
      headers: {
        'User-Agent': 'MailRCV-App',
      },
    });

    if (!apkResponse.ok) {
      console.error("Failed to fetch APK:", apkResponse.status);
      return new Response(
        JSON.stringify({ error: "Download failed" }),
        { 
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Streaming APK to user...");
    
    // Stream the APK with proper headers for download
    return new Response(apkResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="MailRCV-${release.tag_name}.apk"`,
        'Content-Length': apkAsset.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Download failed", details: String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
