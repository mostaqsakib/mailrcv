import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GITHUB_APK_URL = "https://github.com/mostaqsakib/mailrcv/releases/latest/download/app-debug.apk";

serve(async (req) => {
  // Redirect to the GitHub APK download URL
  // User will see the edge function URL, not GitHub
  return new Response(null, {
    status: 302,
    headers: {
      "Location": GITHUB_APK_URL,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});