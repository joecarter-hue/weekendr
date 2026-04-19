import { createClient } from "@supabase/supabase-js";
import type { UserProfile, Preferences, WeekendPlan, WeekendMemory, WeekendReaction } from "@/types";

// Browser client — safe in React components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-only admin client — only used in API routes
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<UserProfile | null> {
  const { data } = await supabase.from("users").select("*").eq("id", id).single();
  return data ?? null;
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const { data } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).single();
  return data ?? null;
}

export async function upsertUser(
  id: string | null,
  name: string,
  email: string,
  partner_name?: string
): Promise<UserProfile> {
  const db = supabaseAdmin();
  const payload = { name, email: email.toLowerCase(), partner_name: partner_name || null };
  const { data, error } = id
    ? await db.from("users").update(payload).eq("id", id).select().single()
    : await db.from("users").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export async function getPreferences(userId: string): Promise<Preferences | null> {
  const { data } = await supabase.from("preferences").select("*").eq("user_id", userId).single();
  return data ?? null;
}

export async function upsertPreferences(
  userId: string,
  prefs: Omit<Preferences, "id" | "user_id" | "updated_at">
): Promise<Preferences> {
  const { data, error } = await supabaseAdmin()
    .from("preferences")
    .upsert({ ...prefs, user_id: userId, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ─── Weekend plans ────────────────────────────────────────────────────────────

export async function getLatestPlans(userId: string): Promise<{ plans: WeekendPlan[]; week_starting: string } | null> {
  const { data } = await supabase
    .from("weekend_plans")
    .select("plans, week_starting")
    .eq("user_id", userId)
    .order("week_starting", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

export async function savePlans(
  userId: string,
  weekStarting: string,
  plans: WeekendPlan[]
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("weekend_plans")
    .upsert({ user_id: userId, week_starting: weekStarting, plans }, { onConflict: "user_id,week_starting" });
  if (error) throw new Error(error.message);
}

// ─── Memory Wall ──────────────────────────────────────────────────────────────

export async function saveMemory(
  userId: string,
  weekStarting: string,
  planName: string,
  planEmoji: string,
  reaction: WeekendReaction,
  highlight?: string
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("weekend_memories")
    .upsert({
      user_id: userId,
      week_starting: weekStarting,
      plan_name: planName,
      plan_emoji: planEmoji,
      reaction,
      highlight: highlight || null,
    }, { onConflict: "user_id,week_starting" });
  if (error) throw new Error(error.message);
}

export async function getMemories(userId: string): Promise<WeekendMemory[]> {
  const { data } = await supabase
    .from("weekend_memories")
    .select("*")
    .eq("user_id", userId)
    .order("week_starting", { ascending: false });
  return data ?? [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the ISO date string for the upcoming Saturday */
export function nextSaturday(): string {
  const d = new Date();
  const daysUntil = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  return d.toISOString().split("T")[0];
}

/** Returns all users with preferences (for the Friday cron job) */
export async function getAllUsersWithPreferences(): Promise<Array<{ user: UserProfile; preferences: Preferences }>> {
  const { data, error } = await supabaseAdmin()
    .from("preferences")
    .select("*, users(*)")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    user: row.users as UserProfile,
    preferences: row as unknown as Preferences,
  }));
}
