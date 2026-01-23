import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  action: 'register' | 'login' | 'check';
  username: string;
  domain?: string;
  password?: string;
}

// Password hashing using Web Crypto API (PBKDF2)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  // Combine salt and hash for storage
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    
    // Decode stored hash
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    
    const newHashBytes = new Uint8Array(derivedBits);
    
    // Constant-time comparison
    if (newHashBytes.length !== storedHashBytes.length) return false;
    let result = 0;
    for (let i = 0; i < newHashBytes.length; i++) {
      result |= newHashBytes[i] ^ storedHashBytes[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, username, domain = 'mailrcv.site', password }: AuthRequest = await req.json();

    console.log(`Inbox auth action: ${action} for ${username}@${domain}`);

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or check domain
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('domain_name', domain)
      .maybeSingle();

    if (domainError) {
      console.error('Domain lookup error:', domainError);
      return new Response(
        JSON.stringify({ error: 'Domain lookup failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let domainId = domainData?.id;

    // Create default domain if not exists
    if (!domainId && domain === 'mailrcv.site') {
      const { data: newDomain, error: createError } = await supabase
        .from('domains')
        .insert({ domain_name: domain, is_verified: true })
        .select('id')
        .single();

      if (createError) {
        console.error('Domain creation error:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create domain' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      domainId = newDomain.id;
    }

    if (!domainId) {
      return new Response(
        JSON.stringify({ error: 'Domain not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if alias exists
    const { data: existingAlias, error: aliasError } = await supabase
      .from('email_aliases')
      .select('id, is_password_protected, password_hash')
      .eq('username', username.toLowerCase())
      .eq('domain_id', domainId)
      .maybeSingle();

    if (aliasError) {
      console.error('Alias lookup error:', aliasError);
      return new Response(
        JSON.stringify({ error: 'Alias lookup failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: CHECK - Check if inbox exists and its type
    if (action === 'check') {
      if (!existingAlias) {
        return new Response(
          JSON.stringify({ 
            exists: false,
            is_password_protected: false 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          exists: true,
          is_password_protected: existingAlias.is_password_protected,
          alias_id: existingAlias.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: REGISTER - Create new password-protected inbox
    if (action === 'register') {
      if (!password || password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingAlias) {
        if (existingAlias.is_password_protected) {
          return new Response(
            JSON.stringify({ error: 'This inbox already exists with a password' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: 'This inbox exists as a public inbox' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Hash password using Web Crypto API
      const passwordHash = await hashPassword(password);

      // Create new password-protected alias
      const { data: newAlias, error: createError } = await supabase
        .from('email_aliases')
        .insert({
          username: username.toLowerCase(),
          domain_id: domainId,
          is_password_protected: true,
          password_hash: passwordHash,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Alias creation error:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create inbox' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate session token
      const sessionToken = crypto.randomUUID();

      console.log(`Created password-protected inbox: ${username}@${domain}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          alias_id: newAlias.id,
          session_token: sessionToken,
          message: 'Inbox created successfully'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: LOGIN - Authenticate to password-protected inbox
    if (action === 'login') {
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!existingAlias) {
        return new Response(
          JSON.stringify({ error: 'Inbox not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!existingAlias.is_password_protected) {
        return new Response(
          JSON.stringify({ error: 'This is a public inbox, no password required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password using Web Crypto API
      const isValid = await verifyPassword(password, existingAlias.password_hash!);

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate session token
      const sessionToken = crypto.randomUUID();

      console.log(`Login successful for: ${username}@${domain}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          alias_id: existingAlias.id,
          session_token: sessionToken
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Inbox auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
