import { createClient } from "@supabase/supabase-js";

import { getSupabaseAuthConfig } from "./config";

export function createApiSupabaseClient(accessToken?: string) {
  const { url, publishableKey } = getSupabaseAuthConfig();

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
