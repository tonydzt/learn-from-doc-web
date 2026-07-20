import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AdminHomePage from "./page";

describe("AdminHomePage", () => {
  it("renders the admin directory landing content", async () => {
    render(await AdminHomePage());

    expect(screen.getByText(/choose a section from the left/i)).toBeInTheDocument();
  });
});
