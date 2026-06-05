"use client";

import { useState, type FormEvent } from "react";

import { waitlistFeatures, type WaitlistFeatureId } from "@/content/waitlist";

const initialSelected = waitlistFeatures.map((feature) => feature.id);

export function WaitlistSignup() {
  const [email, setEmail] = useState("");
  const [selectedFeatures, setSelectedFeatures] =
    useState<WaitlistFeatureId[]>(initialSelected);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        interestedFeatures: selectedFeatures,
      }),
    });
    const result = (await response.json()) as { ok: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setStatus("error");
      setMessage(result.message ?? "Could not save your reservation. Please try again.");
      return;
    }

    setStatus("success");
    setMessage("Reserved. I will only email you when these future features are ready.");
  }

  function toggleFeature(featureId: WaitlistFeatureId) {
    setSelectedFeatures((current) =>
      current.includes(featureId)
        ? current.filter((id) => id !== featureId)
        : [...current, featureId],
    );
  }

  return (
    <form className="waitlist-form" onSubmit={handleSubmit}>
      <div className="waitlist-feature-grid" aria-label="Future feature interests">
        {waitlistFeatures.map((feature) => (
          <label className="waitlist-feature" key={feature.id}>
            <input
              type="checkbox"
              checked={selectedFeatures.includes(feature.id)}
              onChange={() => toggleFeature(feature.id)}
            />
            <span>
              <strong>{feature.title}</strong>
              <small>{feature.description}</small>
            </span>
          </label>
        ))}
      </div>

      <div className="waitlist-email-row">
        <label htmlFor="waitlist-email">Email address</label>
        <div>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="reader@example.com"
            required
          />
          <button
            className="button button--primary"
            type="submit"
            disabled={status === "submitting" || selectedFeatures.length === 0}
          >
            {status === "submitting" ? "Reserving..." : "Reserve updates"}
          </button>
        </div>
      </div>

      <p className={`waitlist-status waitlist-status--${status}`} aria-live="polite">
        {message || "Feature completion notices only. No marketing list."}
      </p>
    </form>
  );
}
