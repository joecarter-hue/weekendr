import { NextRequest, NextResponse } from "next/server";
import { generatePlans } from "@/lib/claude";
import { getMelbourneWeekend } from "@/lib/weather";
import { savePlans, nextSaturday, upsertUser, upsertPreferences } from "@/lib/supabase";
import type { QuickProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, quickProfile, fullProfile } = body as {
      userId?: string;
      quickProfile?: QuickProfile;
      fullProfile?: {
        name: string;
        email: string;
        partner_name?: string;
        suburb: string;
        interests: string[];
        budget: "low" | "medium" | "high";
        party_size: number;
        dietary_notes: string;
        mobility_notes: string;
        other_notes: string;
        delivery_hour: number;
      };
    };

    if (!quickProfile && !fullProfile) {
      return NextResponse.json({ error: "No profile provided." }, { status: 400 });
    }

    // ── 1. Get / create user ─────────────────────────────────────────────
    let uid = userId || null;

    if (fullProfile) {
      const user = await upsertUser(uid, fullProfile.name, fullProfile.email, fullProfile.partner_name);
      uid = user.id;
      await upsertPreferences(uid, {
        suburb: fullProfile.suburb,
        interests: fullProfile.interests,
        budget: fullProfile.budget,
        party_size: fullProfile.party_size,
        dietary_notes: fullProfile.dietary_notes,
        mobility_notes: fullProfile.mobility_notes,
        other_notes: fullProfile.other_notes,
        delivery_hour: fullProfile.delivery_hour,
      });
    } else if (quickProfile) {
      // Create anonymous user if no existing ID
      if (!uid) {
        const user = await upsertUser(null, "Guest", `guest-${Date.now()}@weekendr.app`);
        uid = user.id;
      }
      // Save quick profile as preferences (subset)
      await upsertPreferences(uid, {
        suburb: quickProfile.suburb,
        interests: quickProfile.day_type !== "mixed" ? [quickProfile.day_type] : [],
        budget: quickProfile.budget,
        party_size: quickProfile.party_size,
        dietary_notes: quickProfile.avoid_notes || "",
        mobility_notes: "",
        other_notes: "",
        delivery_hour: 18,
      });
    }

    if (!uid) return NextResponse.json({ error: "Could not create user." }, { status: 500 });

    // ── 2. Fetch weather ─────────────────────────────────────────────────
    const weather = await getMelbourneWeekend();
    const weekStarting = nextSaturday();

    // ── 3. Generate plans ────────────────────────────────────────────────
    const profile = quickProfile ?? {
      suburb: fullProfile!.suburb,
      party_size: fullProfile!.party_size,
      day_type: "mixed" as const,
      budget: fullProfile!.budget,
      avoid_notes: [fullProfile!.dietary_notes, fullProfile!.mobility_notes, fullProfile!.other_notes]
        .filter(Boolean).join(". "),
      interests: fullProfile!.interests,
      dietary_notes: fullProfile!.dietary_notes,
      mobility_notes: fullProfile!.mobility_notes,
      other_notes: fullProfile!.other_notes,
      delivery_hour: fullProfile!.delivery_hour,
    };

    const plans = await generatePlans(profile, weather, weekStarting);

    // ── 4. Persist ───────────────────────────────────────────────────────
    await savePlans(uid, weekStarting, plans);

    return NextResponse.json({ userId: uid, weekStarting, planCount: plans.length });

  } catch (e: unknown) {
    console.error("[/api/generate]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed." },
      { status: 500 }
    );
  }
}
