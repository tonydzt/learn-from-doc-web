import { LandingPage } from "@/components/LandingPage";
import { getOrCreateUserProfile, type UserProfile } from "@/lib/profiles";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  let signedIn = false;
  let userProfile: UserProfile | undefined;

  if (hasSupabaseAuthConfig()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      signedIn = Boolean(user);
      userProfile = user ? await getOrCreateUserProfile(supabase, user) : undefined;
    } catch {
      signedIn = false;
      userProfile = undefined;
    }
  }

  return <LandingPage signedIn={signedIn} userProfile={userProfile} />;
}
