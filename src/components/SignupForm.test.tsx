import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignupForm } from "./SignupForm";

const { pushMock, signUpMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signUp: signUpMock,
    },
  }),
}));

describe("SignupForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    signUpMock.mockReset();
    vi.stubEnv("SITE_URL", "https://example.com");
  });

  it("renders the email confirmation registration form", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("validates invalid form values before contacting Supabase", async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("requests a confirmation email and opens the account waiting page", async () => {
    signUpMock.mockResolvedValue({ error: null });
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "Reader@Example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "reader@example.com",
        password: "password123",
        options: {
          emailRedirectTo: "https://example.com/auth/confirm",
        },
      });
    });
    expect(pushMock).toHaveBeenCalledWith("/account?status=check-email");
  });
});
