type AuthCredentialsInput = {
  email: string;
  password: string;
};

type ValidAuthCredentials = {
  email: string;
  password: string;
};

type ValidationResult =
  | { ok: true; value: ValidAuthCredentials }
  | { ok: false; message: string };

type AuthErrorLike = {
  message?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 8;

export function validateAuthCredentials(input: AuthCredentialsInput): ValidationResult {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!emailPattern.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (!password) {
    return { ok: false, message: "Password is required." };
  }

  if (password.length < minimumPasswordLength) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  return {
    ok: true,
    value: {
      email,
      password,
    },
  };
}

export function authMessageFromError(error: AuthErrorLike | null | undefined): string {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("email not confirmed") || message.includes("not confirmed")) {
    return "Confirm your email before signing in.";
  }

  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "Check your email and password, then try again.";
  }

  return "Authentication is unavailable. Please try again.";
}

export function getAuthRedirectUrl(): string {
  return `${getPublicSiteUrl()}/auth/confirm`;
}

export function getPublicSiteUrl(): string {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "");
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}
