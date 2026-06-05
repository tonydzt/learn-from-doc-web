import { NextResponse } from "next/server";

import { subscribeToWaitlist, WaitlistError } from "@/lib/waitlist";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    await subscribeToWaitlist({
      email: String(body.email ?? ""),
      interestedFeatures: Array.isArray(body.interestedFeatures) ? body.interestedFeatures : [],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WaitlistError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { ok: false, message: "Could not save your reservation. Please try again." },
      { status: 500 },
    );
  }
}
