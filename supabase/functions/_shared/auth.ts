import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

export function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function validateApiKey(
  req: Request,
  requiredPermission: string,
): Promise<{ valid: boolean; keyName?: string; error?: string }> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return { valid: false, error: "Missing x-api-key header" };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("api_keys")
    .select("key_name, permissions, active, expires_at")
    .eq("key_value", apiKey)
    .maybeSingle();

  if (error || !data) return { valid: false, error: "Invalid API key" };
  if (!data.active) return { valid: false, error: "API key is inactive" };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: "API key expired" };
  }

  const perms: string[] = data.permissions || [];
  const hasPermission = perms.some((p) => {
    if (p === requiredPermission) return true;
    const [action, resource] = p.split(":");
    const [reqAction, reqResource] = requiredPermission.split(":");
    if (action === "read_write" && resource === reqResource) return true;
    return false;
  });

  if (!hasPermission) {
    return { valid: false, error: `Missing permission: ${requiredPermission}` };
  }

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_value", apiKey);

  return { valid: true, keyName: data.key_name };
}

export async function logSync(
  syncType: string,
  source: string,
  target: string,
  recordsSent: number,
  recordsFailed: number,
  status: string,
  errorMessage?: string,
) {
  const supabase = getSupabase();
  await supabase.from("sync_log").insert({
    sync_type: syncType,
    source_system: source,
    target_system: target,
    records_sent: recordsSent,
    records_failed: recordsFailed,
    status,
    error_message: errorMessage || null,
    completed_at: status !== "pending" ? new Date().toISOString() : null,
  });
}

export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(error: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
