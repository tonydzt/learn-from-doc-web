export const waitlistFeatures = [
  {
    id: "user_accounts",
    title: "User registration and login",
    description: "Create an account so progress can belong to you instead of one browser profile.",
  },
  {
    id: "progress_dashboard",
    title: "Personal progress dashboard",
    description: "Review indexed documentation sets and reading progress from a dedicated web app.",
  },
  {
    id: "cross_device_sync",
    title: "Cross-device progress sync",
    description: "Keep reading state aligned across your signed-in browsers and machines.",
  },
] as const;

export type WaitlistFeatureId = (typeof waitlistFeatures)[number]["id"];

export const waitlistFeatureIds = waitlistFeatures.map((feature) => feature.id);

export function isWaitlistFeatureId(value: string): value is WaitlistFeatureId {
  return waitlistFeatureIds.includes(value as WaitlistFeatureId);
}
