"use client";

import { useState, type FormEvent } from "react";

export function SiteIndexRequestForm() {
  const [requestText, setRequestText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/site-index-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestText }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.message ?? "Could not save your request. Please try again.");
        return;
      }

      setRequestText("");
      setStatus("success");
      setMessage("Request received. Thank you for helping choose what comes next.");
    } catch {
      setStatus("error");
      setMessage("Could not save your request. Please try again.");
    }
  }

  return (
    <form className="site-request-form" onSubmit={handleSubmit}>
      <label htmlFor="site-index-request">Site name or docs URL</label>
      <div className="site-request-input-row">
        <input
          id="site-index-request"
          name="requestText"
          type="text"
          value={requestText}
          onChange={(event) => setRequestText(event.target.value)}
          placeholder="e.g. vuejs.org/guide"
          maxLength={500}
          required
        />
        <button
          className="button button--primary"
          type="submit"
          disabled={status === "submitting" || !requestText.trim()}
        >
          {status === "submitting" ? "Sending..." : "Request this index"}
        </button>
      </div>
      <p className={`site-request-status site-request-status--${status}`} aria-live="polite">
        {message || "One site per request. A documentation URL helps me find the right scope."}
      </p>
    </form>
  );
}
