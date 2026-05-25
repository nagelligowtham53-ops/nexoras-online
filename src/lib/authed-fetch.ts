import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch wrapper that automatically attaches the current Supabase session's
 * bearer token. Use for calls to authenticated `/api/*` route handlers.
 */
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
