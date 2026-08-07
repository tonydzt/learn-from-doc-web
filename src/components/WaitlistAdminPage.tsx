import { waitlistFeatures } from "@/content/waitlist";
import type { WaitlistSummary } from "@/lib/waitlist";

import { sendWaitlistNotification } from "@/app/admin/waitlist/actions";

type WaitlistAdminPageProps = {
  summary?: WaitlistSummary;
};

export function WaitlistAdminPage({ summary }: WaitlistAdminPageProps) {
  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Private operations</p>
        <h1>Waitlist admin</h1>
      </div>

      <div className="admin-grid">
          <section className="admin-panel" aria-label="Waitlist summary">
            <span className="admin-stat">{summary?.totalSubscribers ?? 0}</span>
            <h2>Total reservations</h2>
            <div className="admin-feature-counts">
              {waitlistFeatures.map((feature) => (
                <p key={feature.id}>
                  <strong>{summary?.featureCounts[feature.id] ?? 0}</strong>
                  <span>{feature.title}</span>
                </p>
              ))}
            </div>
          </section>

          <form className="admin-panel admin-send" action={sendWaitlistNotification}>
            <h2>Send feature completion notice</h2>
            <label htmlFor="notification-subject">Email subject</label>
            <input id="notification-subject" name="subject" required />
            <label htmlFor="notification-body">Email body</label>
            <textarea id="notification-body" name="body" rows={8} required />
            <button className="button button--primary" type="submit">
              Send notification
            </button>
          </form>

          <section className="admin-panel admin-history" aria-label="Notification history">
            <h2>Notification history</h2>
            {summary?.notifications.length ? (
              <ol>
                {summary.notifications.map((notification) => (
                  <li key={notification.id}>
                    <strong>{notification.subject}</strong>
                    <span>
                      {notification.sentCount} sent / {notification.failedCount} failed
                    </span>
                    <time dateTime={notification.createdAt}>
                      {new Date(notification.createdAt).toLocaleString("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No notifications sent yet.</p>
            )}
          </section>
      </div>
    </>
  );
}
