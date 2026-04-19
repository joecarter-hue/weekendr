// ─── User & Preferences ──────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  partner_name?: string;
  created_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  suburb: string;
  interests: string[];
  budget: "low" | "medium" | "high";
  party_size: number;
  dietary_notes: string;
  mobility_notes: string;
  other_notes: string;
  delivery_hour: number;       // 0–23, Melbourne time (default: 18)
  updated_at: string;
}

// Quick profile — used for Path B (Build my weekend now)
export interface QuickProfile {
  suburb: string;
  party_size: number;
  day_type: "active" | "cultural" | "foodie" | "mixed";
  budget: "low" | "medium" | "high";
  avoid_notes?: string;
  // Optional — filled in if they continue to full setup
  name?: string;
  email?: string;
}

// ─── Activity & Plans ─────────────────────────────────────────────────────────

export interface Activity {
  time: string;
  name: string;
  venue: string;
  description: string;
  tip?: string;
  emoji: string;
  dot_color: "terra" | "sage" | "amber";
  bg_gradient: string;    // CSS gradient for card image area
  type: string;           // e.g. "Coffee", "Outdoors", "Food"
}

// Each activity slot has a main pick + pre-generated alternatives for swapping
export interface ActivitySlot {
  main: Activity;
  alts: Activity[];       // 2 alternatives, pre-generated
  chosen_index: number;   // 0 = main, 1 = alt1, 2 = alt2
}

export interface DayPlan {
  theme: string;
  slots: ActivitySlot[];
}

export interface WeekendPlan {
  id: 1 | 2 | 3;
  emoji: string;
  vibe: string;
  name: string;
  tagline: string;
  perfect_for: string;
  estimated_cost: string;
  saturday: DayPlan;
  sunday: DayPlan;
  // Mood alignment — which moods this plan suits
  moods: Array<"recharge" | "explore" | "celebrate">;
}

export interface GeneratedWeekend {
  plans: WeekendPlan[];
  generated_at: string;
  week_starting: string;   // ISO date of upcoming Saturday
}

// ─── Confirmed day (after swiping) ───────────────────────────────────────────

export interface ConfirmedDay {
  plan_name: string;
  plan_emoji: string;
  activities: Activity[];  // The chosen activity from each slot
  day: "saturday" | "sunday";
}

// ─── Memory Wall ─────────────────────────────────────────────────────────────

export type WeekendReaction = "loved" | "good" | "meh";

export interface WeekendMemory {
  id: string;
  user_id: string;
  week_starting: string;
  plan_name: string;
  plan_emoji: string;
  reaction: WeekendReaction;
  highlight?: string;
  created_at: string;
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export interface DayWeather {
  date: string;
  max_temp: number;
  min_temp: number;
  description: string;
  rain_mm: number;
}

export interface WeekendWeather {
  saturday: DayWeather;
  sunday: DayWeather;
}
