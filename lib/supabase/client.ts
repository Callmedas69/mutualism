import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Supabase client for server-side operations
 * Uses service role key for full database access
 *
 * IMPORTANT: Only use this on the server side (API routes, server components)
 * Never expose service role key to the client
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
