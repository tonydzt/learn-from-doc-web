"use client";

import { useEffect } from "react";

type AdminTesterFeedbackProps = {
  error?: string;
  status?: string;
};

export function AdminTesterFeedback({ error, status }: AdminTesterFeedbackProps) {
  useEffect(() => {
    if (error) {
      window.alert(error);
    }
  }, [error]);

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (status === "added") {
    return <p role="status">Tester access added.</p>;
  }

  if (status === "removed") {
    return <p role="status">Tester access removed.</p>;
  }

  return null;
}
