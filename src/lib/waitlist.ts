import { waitlistFeatureIds, type WaitlistFeatureId } from "@/content/waitlist";

type WaitlistInput = {
  email: string;
  interestedFeatures: string[];
};

type ValidWaitlistInput = {
  email: string;
  interestedFeatures: WaitlistFeatureId[];
};

type ValidationResult =
  | { ok: true; value: ValidWaitlistInput }
  | { ok: false; message: string };

type SupabaseSubscriber = {
  id: string;
  email: string;
  interested_features?: WaitlistFeatureId[];
};

type SupabaseNotification = {
  id: string;
  subject: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

export type WaitlistSummary = {
  totalSubscribers: number;
  featureCounts: Record<WaitlistFeatureId, number>;
  notifications: {
    id: string;
    subject: string;
    sentCount: number;
    failedCount: number;
    createdAt: string;
  }[];
};

export type NotifyWaitlistInput = {
  subject: string;
  body: string;
};

export type NotifyWaitlistResult = {
  notificationId: string;
  total: number;
  sent: number;
  failed: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateWaitlistRequest(input: WaitlistInput): ValidationResult {
  const email = input.email.trim().toLowerCase();
  const selected = [...new Set(input.interestedFeatures)];
  const invalidFeature = selected.find(
    (feature) => !waitlistFeatureIds.includes(feature as WaitlistFeatureId),
  );

  if (!emailPattern.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (selected.length === 0) {
    return { ok: false, message: "Select at least one future feature." };
  }

  if (invalidFeature) {
    return { ok: false, message: "Select only supported future features." };
  }

  return {
    ok: true,
    value: {
      email,
      interestedFeatures: selected as WaitlistFeatureId[],
    },
  };
}

export async function subscribeToWaitlist(input: WaitlistInput) {
  const validation = validateWaitlistRequest(input);

  if (!validation.ok) {
    throw new WaitlistError(validation.message, 400);
  }

  return supabaseRequest<SupabaseSubscriber[]>("waitlist_subscribers?on_conflict=email", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      email: validation.value.email,
      interested_features: validation.value.interestedFeatures,
      consent_scope: "feature_completion_only",
      source: "homepage_waitlist",
      updated_at: new Date().toISOString(),
    }),
    errorMessage: "Could not save your reservation. Please try again.",
  });
}

export async function getWaitlistSummary(): Promise<WaitlistSummary> {
  const [subscribers, notifications] = await Promise.all([
    supabaseRequest<SupabaseSubscriber[]>(
      "waitlist_subscribers?select=id,email,interested_features&order=created_at.desc",
      {
        method: "GET",
        errorMessage: "Could not load waitlist subscribers.",
      },
    ),
    supabaseRequest<SupabaseNotification[]>(
      "waitlist_notifications?select=id,subject,sent_count,failed_count,created_at&order=created_at.desc&limit=10",
      {
        method: "GET",
        errorMessage: "Could not load waitlist notifications.",
      },
    ),
  ]);

  const featureCounts = Object.fromEntries(waitlistFeatureIds.map((id) => [id, 0])) as Record<
    WaitlistFeatureId,
    number
  >;

  subscribers.forEach((subscriber) => {
    subscriber.interested_features?.forEach((feature) => {
      featureCounts[feature] += 1;
    });
  });

  return {
    totalSubscribers: subscribers.length,
    featureCounts,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      subject: notification.subject,
      sentCount: notification.sent_count,
      failedCount: notification.failed_count,
      createdAt: notification.created_at,
    })),
  };
}

export async function notifyWaitlistSubscribers(
  input: NotifyWaitlistInput,
): Promise<NotifyWaitlistResult> {
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (!subject || !body) {
    throw new WaitlistError("Email subject and body are required.", 400);
  }

  const subscribers = await supabaseRequest<SupabaseSubscriber[]>(
    "waitlist_subscribers?select=id,email&order=created_at.asc",
    {
      method: "GET",
      errorMessage: "Could not load waitlist subscribers.",
    },
  );
  const [notification] = await supabaseRequest<SupabaseNotification[]>("waitlist_notifications", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      subject,
      body,
      total_count: subscribers.length,
      sent_count: 0,
      failed_count: 0,
    }),
    errorMessage: "Could not create notification record.",
  });

  const results = await Promise.all(
    subscribers.map(async (subscriber) => {
      try {
        const resendResult = await sendEmail(subscriber.email, subject, body);
        return {
          subscriber_id: subscriber.id,
          email: subscriber.email,
          status: "sent",
          resend_id: resendResult.id,
          error_message: null,
        };
      } catch (error) {
        return {
          subscriber_id: subscriber.id,
          email: subscriber.email,
          status: "failed",
          resend_id: null,
          error_message: error instanceof Error ? error.message : "Unknown email error",
        };
      }
    }),
  );

  const sent = results.filter((result) => result.status === "sent").length;
  const failed = results.length - sent;

  if (results.length > 0) {
    await supabaseRequest("waitlist_notification_recipients", {
      method: "POST",
      body: JSON.stringify(
        results.map((result) => ({
          notification_id: notification.id,
          ...result,
        })),
      ),
      errorMessage: "Could not save notification recipient results.",
    });
  }

  await supabaseRequest(`waitlist_notifications?id=eq.${notification.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      sent_count: sent,
      failed_count: failed,
    }),
    errorMessage: "Could not update notification totals.",
  });

  return {
    notificationId: notification.id,
    total: subscribers.length,
    sent,
    failed,
  };
}

export class WaitlistError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
  }
}

async function supabaseRequest<T = unknown>(
  path: string,
  init: RequestInit & { errorMessage: string },
): Promise<T> {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const { errorMessage, headers, ...requestInit } = init;
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...requestInit,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new WaitlistError(`${errorMessage} ${detail}`.trim(), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (typeof response.text === "function") {
    const text = await response.text();

    return (text ? JSON.parse(text) : undefined) as T;
  }

  return response.json() as Promise<T>;
}

async function sendEmail(email: string, subject: string, body: string): Promise<{ id: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnv("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: requiredEnv("WAITLIST_NOTIFY_FROM"),
      to: email,
      subject,
      text: `${body}\n\nYou are receiving this one-time feature completion notice because you reserved future Developer Docs Progress Tracker features.`,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<{ id: string }>;
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new WaitlistError(`${name} is required.`);
  }

  return value;
}
