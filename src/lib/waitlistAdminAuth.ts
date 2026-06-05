import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "waitlist_admin_session";

export { cookieName as waitlistAdminCookieName };

export function verifyAdminPassword(password: string): boolean {
  const configuredPassword = process.env.WAITLIST_ADMIN_PASSWORD;

  if (!configuredPassword) {
    return false;
  }

  return safeEqual(password, configuredPassword);
}

export function createAdminSessionCookieValue(now = Date.now()): string {
  const issuedAt = String(now);
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifyAdminSessionCookieValue(value: string | undefined, now = Date.now()): boolean {
  if (!value) {
    return false;
  }

  const [issuedAt, signature] = value.split(".");

  if (!issuedAt || !signature || sign(issuedAt) !== signature) {
    return false;
  }

  const ageMs = now - Number(issuedAt);

  return Number.isFinite(ageMs) && ageMs >= 0 && ageMs < 1000 * 60 * 60 * 12;
}

function sign(value: string): string {
  const secret = process.env.WAITLIST_ADMIN_SESSION_SECRET;

  if (!secret) {
    return "";
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  return (
    inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer)
  );
}
