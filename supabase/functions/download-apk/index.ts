import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GITHUB_REPO = "mostaqsakib/mailrcv";

serve(async (req) => {
  try {
    // Fetch the latest release from GitHub API
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    console.log("Fetching latest release from:", apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "MailRCV-App"
      }
    });

    if (!response.ok) {
      console.error("GitHub API error:", response.status, await response.text());
      return new Response(
        JSON.stringify({ error: "Could not fetch latest release" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const release = await response.json();
    console.log("Latest release tag:", release.tag_name);
    console.log("Assets:", release.assets?.map((a: any) => a.name));

    // Find the APK asset
    const apkAsset = release.assets?.find((asset: any) => 
      asset.name.endsWith('.apk')
    );

    if (!apkAsset) {
      console.error("No APK found in release assets");
      return new Response(
        JSON.stringify({ error: "No APK found in latest release" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log("Redirecting to APK:", apkAsset.browser_download_url);

    // Redirect to the actual APK download URL
    return new Response(null, {
      status: 302,
      headers: {
        "Location": apkAsset.browser_download_url,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Download failed" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});