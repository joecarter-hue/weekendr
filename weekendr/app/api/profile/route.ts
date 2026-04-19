import { NextRequest, NextResponse } from "next/server";
import { getUserById, getPreferences, getLatestPlans } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "No userId" }, { status: 400 });

  const [user, preferences, plansData] = await Promise.all([
    getUserById(userId),
    getPreferences(userId),
    getLatestPlans(userId),
  ]);

  return NextResponse.json({
    user,
    preferences,
    plans: plansData?.plans ?? null,
    week_starting: plansData?.week_starting ?? null,
  });
}
