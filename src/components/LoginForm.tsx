"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authMessageFromError, validateAuthCredentials } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMessage =
    searchParams.get("message") === "confirmation-failed"
      ? "The confirmation link could not be verified. Try signing in or request a new account email."
      : "Use the password you set when creating the account.";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState(initialMessage);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateAuthCredentials({ email, password });

    if (!validation.ok) {
      setStatus("error");
      setMessage(validation.message);
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.value.email,
        password: validation.value.password,
      });

      if (error) {
        setStatus("error");
        setMessage(authMessageFromError(error));
        return;
      }

      router.push("/account");
    } catch {
      setStatus("error");
      setMessage("Authentication is not configured. Add the Supabase public keys first.");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="login-email">Email address</label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="reader@example.com"
        required
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={8}
        required
      />

      <button className="button button--primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Signing in..." : "Sign in"}
      </button>

      <p className={`auth-status auth-status--${status}`} aria-live="polite">
        {message}
      </p>

      <p className="auth-switch">
        Need an account? <Link href="/signup">Create one</Link>
      </p>
    </form>
  );
}
