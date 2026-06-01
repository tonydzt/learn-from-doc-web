import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GoogleAnalytics } from "./GoogleAnalytics";

describe("GoogleAnalytics", () => {
  it("does not render analytics scripts without a measurement id", () => {
    const { container } = render(<GoogleAnalytics />);

    expect(container.querySelector("script")).toBeNull();
  });

  it("renders the Google tag scripts for a GA4 measurement id", async () => {
    const measurementId = "G-TEST1234";

    render(<GoogleAnalytics measurementId={measurementId} />);

    await waitFor(() => {
      expect(
        document.querySelector(
          `script[src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`,
        ),
      ).not.toBeNull();
    });
    expect(document.querySelector("#google-analytics")?.textContent).toContain(
      `gtag("config", "${measurementId}")`,
    );
  });
});
