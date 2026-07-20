import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WaitlistAdminPage } from "./WaitlistAdminPage";

describe("WaitlistAdminPage", () => {
  it("shows subscriber stats and the notification form to authenticated admins", () => {
    render(
      <WaitlistAdminPage
        summary={{
          totalSubscribers: 7,
          featureCounts: {
            user_accounts: 5,
            progress_dashboard: 4,
            cross_device_sync: 6,
          },
          notifications: [
            {
              id: "notification-1",
              subject: "Sync is ready",
              sentCount: 6,
              failedCount: 1,
              createdAt: "2026-06-04T06:00:00.000Z",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/cross-device progress sync/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email body/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send notification/i })).toBeInTheDocument();
    expect(screen.getByText(/sync is ready/i)).toBeInTheDocument();
  });
});
