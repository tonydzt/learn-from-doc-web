import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminTesterFeedback } from "./AdminTesterFeedback";

describe("AdminTesterFeedback", () => {
  it("shows an alert dialog and inline message for add errors", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    render(<AdminTesterFeedback error="No account exists for that email address." />);

    expect(alertMock).toHaveBeenCalledWith("No account exists for that email address.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No account exists for that email address.",
    );

    alertMock.mockRestore();
  });

  it("does not open an alert dialog for successful operations", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    render(<AdminTesterFeedback status="added" />);

    expect(alertMock).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Tester access added.");

    alertMock.mockRestore();
  });
});
