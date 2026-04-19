import { NextRequest, NextResponse } from "next/server";
import { generateSendOff } from "@/lib/claude";
import type { ConfirmedDay } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { confirmed } = await req.json() as { confirmed: ConfirmedDay };
    const message = await generateSendOff(confirmed);
    return NextResponse.json({ message });
  } catch (e) {
    console.error("[/api/sendoff]", e);
    // Graceful fallback — never break the send-off screen
    return NextResponse.json({ message: "Right then. You've got a cracking day ahead. Stop reading this and go." });
  }
}
