import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server-only code paths that must bypass
 * Storage RLS — specifically the no-login employee signing flow, where the
 * signing token (not a Supabase session) is the authorization check.
 * NEVER import this from a Client Component or expose the service key to the browser.
 */
export const createServiceClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
