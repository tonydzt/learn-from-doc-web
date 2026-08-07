import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAuthConfig } from "./config";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = getSupabaseAuthConfig();

  return createBrowserClient(url, publishableKey);
}
