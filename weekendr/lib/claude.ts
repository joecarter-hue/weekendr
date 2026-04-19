import Anthropic from "@anthropic-ai/sdk";
import type { QuickProfile, Preferences, UserProfile, WeekendPlan, WeekendWeather, Activity, ConfirmedDay } from "@/types";
import { weatherSummary } from "./weather";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BUDGET_DESC: Record<string, string> = {
  low:    "free or under $20 total for the day",
  medium: "$40–100 per person",
  high:   "$100–200+ per person, happy to splurge",
};

const DAY_TYPE_DESC: Record<string, string> = {
  active:   "active and outdoorsy — walks, rides, markets, physical activity",
  cultural: "cultural and relaxed — galleries, neighbourhoods, cafes, wandering",
  foodie:   "food and drink focused — cafes, restaurants, bars, markets",
  mixed:    "a good mix — variety, something for everyone",
};

const SEASON = (m: number) =>
  m >= 2 && m <= 4 ? "autumn" : m >= 5 && m <= 7 ? "winter" : m >= 8 && m <= 10 ? "spring" : "summer";

// ─── Main plan generation ─────────────────────────────────────────────────────

export async function generatePlans(
  profile: QuickProfile | (Preferences & { user?: UserProfile }),
  weather: WeekendWeather,
  weekStarting: string
): Promise<WeekendPlan[]> {

  const isQuick = "day_type" in profile;
  const suburb = profile.suburb || "Melbourne";
  const budget = BUDGET_DESC[profile.budget];
  const partySize = profile.party_size;
  const date = new Date(weekStarting);
  const season = SEASON(date.getMonth());
  const dateLabel = date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  const interestLine = isQuick
    ? `Day type preference: ${DAY_TYPE_DESC[(profile as QuickProfile).day_type]}`
    : `Interests: ${(profile as Preferences).interests.join(", ") || "open to anything"}`;

  const avoidLine = isQuick
    ? (profile as QuickProfile).avoid_notes || "none"
    : [(profile as Preferences).dietary_notes, (profile as Preferences).mobility_notes, (profile as Preferences).other_notes].filter(Boolean).join(". ") || "none";

  const prompt = `You are a Melbourne weekend concierge. Generate 3 itinerary options for ${partySize === 1 ? "a solo person" : partySize === 2 ? "a couple" : `a group of ${partySize}`} based in ${suburb}.

Profile: ${interestLine}. Budget: ${budget}. Avoid: ${avoidLine}.
Weekend: ${dateLabel} (${season}). Weather: ${weatherSummary(weather)}.

Return ONLY valid JSON, no markdown. Use this exact structure:

{"plans":[{"id":1,"emoji":"🌿","vibe":"Outdoors & Active","name":"The Green Escape","tagline":"Fresh air, tired legs, big smiles.","perfect_for":"when you need to reset","estimated_cost":"$30–50pp","moods":["explore","recharge"],"saturday":{"theme":"Morning trails","slots":[{"main":{"time":"9am","name":"Breakfast at Lune","venue":"Lune Croissanterie, Rose St Fitzroy","tip":"Order the ham & cheese. Queue moves fast.","emoji":"☕","dot_color":"terra"},"alts":[{"time":"9am","name":"Market Lane Coffee","venue":"Market Lane, Prahran Market","tip":"Single origin, beautiful setting.","emoji":"☕","dot_color":"terra"}],"chosen_index":0}]},"sunday":{"theme":"Slow Sunday","slots":[{"main":{"time":"10am","name":"Example","venue":"Venue, Suburb","tip":"Insider tip here.","emoji":"🌿","dot_color":"sage"},"alts":[{"time":"10am","name":"Alt Example","venue":"Alt Venue, Suburb","tip":"Alt tip.","emoji":"🌿","dot_color":"sage"}],"chosen_index":0}]}}]}

Rules:
- 3 plans: 🌿 Outdoors, 🎨 Cultural, 🍽 Food & social
- Each plan: Saturday + Sunday, 2–3 slots each, 1 alt per slot
- Real Melbourne venues, specific addresses
- Factor in weather (rain = indoor/covered options)
- dot_color must be "terra", "sage", or "amber"
- chosen_index always 0
- No extra fields beyond the example structure`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed.plans as WeekendPlan[];
}

// ─── Micky Flanagan send-off message ─────────────────────────────────────────

export async function generateSendOff(confirmed: ConfirmedDay): Promise<string> {
  const activityList = confirmed.activities
    .map((a) => `${a.time} — ${a.name} at ${a.venue}`)
    .join("\n");

  const intensity = confirmed.activities.length >= 4 ? "big full day" : "relaxed day";

  const prompt = `You are writing in the voice of Micky Flanagan — the British comedian famous for the "going out out" bit.
Warm, working class, observational, self-deprecating, cheeky. Never mean. Always relatable.

The user has just built their Saturday itinerary:
${activityList}

This looks like a ${intensity}.

Write a short send-off message (3–5 sentences max) in Micky's voice that:
- Reacts to what they've actually planned (reference specific activities or venues)
- Captures the energy of the day (big and full = "you're going OUT out", relaxed = "this is just going out, and that's beautiful")
- Makes them laugh and feel pumped to go
- Ends on a high — sends them out the door

DO NOT use asterisks or stage directions. Just the words Micky would say.
Return ONLY the message text, nothing else.`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();
}

// ─── Generating screen status messages ───────────────────────────────────────

export const GENERATING_STEPS = [
  "Reading the Melbourne forecast…",
  "Raiding our local knowledge…",
  "Finding the best spots in your area…",
  "Building your Saturday…",
  "Plotting a pretty good Sunday too…",
  "Adding a cheeky alternative or two…",
  "Nearly there…",
  "Your weekend is ready.",
];
