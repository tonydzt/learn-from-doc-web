import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("links anonymous visitors to sign in", () => {
    render(<SiteHeader />);

    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    const signIn = within(nav).getByRole("link", { name: /sign in/i });

    expect(signIn).toHaveAttribute("href", "/login");
    expect(signIn).toHaveClass("nav-cta");
    expect(within(nav).queryByRole("link", { name: /add to chrome/i })).toBeNull();
  });

  it("links signed-in visitors to their account", () => {
    render(
      <SiteHeader
        signedIn
        userProfile={{
          nickname: "Reader",
          avatarInitial: "R",
          avatarBackground: "#174E63",
          avatarColor: "#F9C846",
        }}
      />,
    );

    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    const account = within(nav).getByRole("link", { name: /reader account/i });

    expect(account).toHaveAttribute("href", "/account");
    expect(within(account).getByText("R")).toBeInTheDocument();
  });
});
