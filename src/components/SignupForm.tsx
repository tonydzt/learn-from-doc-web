"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authMessageFromError, getAuthRedirectUrl, validateAuthCredentials } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("Use a real inbox. Supabase will send a confirmation link.");

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
      const { error } = await supabase.auth.signUp({
        email: validation.value.email,
        password: validation.value.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) {
        setStatus("error");
        setMessage(authMessageFromError(error));
        return;
      }

      setStatus("success");
      router.push("/account?status=check-email");
    } catch {
      setStatus("error");
      setMessage("Authentication is not configured. Add the Supabase public keys first.");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="signup-email">Email address</label>
      <input
        id="signup-email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="reader@example.com"
        required
      />

      <label htmlFor="signup-password">Password</label>
      <input
        id="signup-password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={8}
        required
      />

      <button className="button button--primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Creating..." : "Create account"}
      </button>

      <p className={`auth-status auth-status--${status}`} aria-live="polite">
        {message}
      </p>

      <p className="auth-switch">
        Already confirmed? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
