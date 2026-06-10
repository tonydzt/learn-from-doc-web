import type { User } from "@supabase/supabase-js";

import type { createServerSupabaseClient } from "./supabase/server";

export type UserProfile = {
  userId: string;
  nickname: string;
  avatarInitial: string;
  avatarBackground: string;
  avatarColor: string;
};

type ProfileRow = {
  user_id: string;
  nickname: string;
  avatar_initial: string;
  avatar_background: string;
  avatar_color: string;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const nicknameChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const avatarBackgrounds = ["#174E63", "#7B3F3F", "#275C42", "#6E4B8B", "#9B4D28", "#263B73"];
const avatarColors = ["#F9C846", "#FFFFFF", "#CDE7FF", "#FFE3D8", "#D7F7DF", "#F5E6FF"];

export function generateNickname(): string {
  return Array.from({ length: 8 }, () => nicknameChars[randomIndex(nicknameChars.length)]).join("");
}

export function generateAvatarStyle(email: string): Pick<
  UserProfile,
  "avatarInitial" | "avatarBackground" | "avatarColor"
> {
  return {
    avatarInitial: avatarInitialFromEmail(email),
    avatarBackground: avatarBackgrounds[randomIndex(avatarBackgrounds.length)],
    avatarColor: avatarColors[randomIndex(avatarColors.length)],
  };
}

export function createDefaultUserProfile(userId: string, email: string): UserProfile {
  return {
    userId,
    nickname: generateNickname(),
    ...generateAvatarStyle(email),
  };
}

export async function getOrCreateUserProfile(
  supabase: ServerSupabaseClient,
  user: Pick<User, "id" | "email">,
): Promise<UserProfile> {
  const { data } = await supabase
    .from("user_profiles")
    .select("user_id, nickname, avatar_initial, avatar_background, avatar_color")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) {
    return profileFromRow(data);
  }

  const profile = createDefaultUserProfile(user.id, user.email ?? "");
  const { data: inserted } = await supabase
    .from("user_profiles")
    .insert(profileToRow(profile))
    .select("user_id, nickname, avatar_initial, avatar_background, avatar_color")
    .single();

  return inserted ? profileFromRow(inserted) : profile;
}

export async function updateUserNickname(
  supabase: ServerSupabaseClient,
  userId: string,
  nickname: string,
): Promise<void> {
  await supabase
    .from("user_profiles")
    .update({ nickname: normalizeNickname(nickname) })
    .eq("user_id", userId);
}

export async function regenerateUserAvatar(
  supabase: ServerSupabaseClient,
  user: Pick<User, "id" | "email">,
): Promise<void> {
  await supabase.from("user_profiles").update(profileToAvatarRow(generateAvatarStyle(user.email ?? ""))).eq(
    "user_id",
    user.id,
  );
}

export function normalizeNickname(nickname: string): string {
  const trimmed = nickname.trim();

  if (!trimmed) {
    return generateNickname();
  }

  return trimmed.slice(0, 32);
}

function profileFromRow(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    nickname: row.nickname,
    avatarInitial: row.avatar_initial,
    avatarBackground: row.avatar_background,
    avatarColor: row.avatar_color,
  };
}

function profileToRow(profile: UserProfile): ProfileRow {
  return {
    user_id: profile.userId,
    nickname: profile.nickname,
    avatar_initial: profile.avatarInitial,
    avatar_background: profile.avatarBackground,
    avatar_color: profile.avatarColor,
  };
}

function profileToAvatarRow(
  avatar: Pick<UserProfile, "avatarInitial" | "avatarBackground" | "avatarColor">,
) {
  return {
    avatar_initial: avatar.avatarInitial,
    avatar_background: avatar.avatarBackground,
    avatar_color: avatar.avatarColor,
  };
}

function avatarInitialFromEmail(email: string): string {
  const firstCharacter = email.trim().charAt(0);

  return firstCharacter ? firstCharacter.toUpperCase() : "U";
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}
