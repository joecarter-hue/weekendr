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

  const prompt = `You are a brilliant Melbourne weekend concierge — opinionated, specific, and deeply local. You know every laneway café, hidden gallery, trail, and neighbourhood bar in the city.

Generate 3 complete weekend itinerary options for ${partySize === 1 ? "a solo person" : partySize === 2 ? "a couple" : `a group of ${partySize}`} based in ${suburb}.

PROFILE
- ${interestLine}
- Budget: ${budget}
- Things to avoid / notes: ${avoidLine}

CONTEXT
- Weekend: ${dateLabel} (${season} in Melbourne)
- Weather: ${weatherSummary(weather)}

REQUIREMENTS
Create exactly 3 plans with these distinct personalities:
  Plan 1 emoji 🌿 — Outdoors & active (walks, trails, parks, physical)
  Plan 2 emoji 🎨 — Cultural & neighbourhoods (galleries, wandering, cafes, local discovery)
  Plan 3 emoji 🍽 — Food & social (restaurants, bars, markets, eating well)

For EACH plan:
- Name it memorably (e.g. "The Green Escape", "Neighbourhood Deep Dive")
- Write a punchy one-sentence tagline
- Give Saturday AND Sunday, each with 2–4 activity slots
- For EACH activity slot, provide the MAIN activity PLUS 2 ALTERNATIVES (so the user can swap if they want something different)
- Be SPECIFIC: real venue names, real Melbourne streets and suburbs
- Factor in weather — if rain is forecast, lean into indoor options or covered spots
- Include at least one insider tip per activity
- Make each of the 3 plans feel genuinely different in energy and geography

RULES
- Name real places (e.g. "Patricia Coffee Brewers, Little William St" not "a local café")
- Don't suggest things that require advance planning the user hasn't done unless you flag it
- Honour dietary/mobility notes throughout
- No tourist clichés as primary activities

RESPONSE FORMAT
Return ONLY valid JSON — no markdown, no explanation, just the object.

{
  "plans": [
    {
      "id": 1,
      "emoji": "🌿",
      "vibe": "Outdoors & Active",
      "name": "The Green Escape",
      "tagline": "Fresh air, tired legs, big smiles.",
      "perfect_for": "when you need to get out of your heads",
      "estimated_cost": "$30–50 per person",
      "moods": ["explore", "recharge"],
      "saturday": {
        "theme": "Morning trails and slow lunch",
        "slots": [
          {
            "main": {
              "time": "8:30am",
              "name": "Breakfast Before the Crowds",
              "venue": "Lune Croissanterie, Rose St Fitzroy",
              "description": "The best croissants in the southern hemisphere. Get there at opening — queue moves fast.",
              "tip": "Order the ham & cheese. Non-negotiable.",
              "emoji": "☕",
              "dot_color": "terra",
              "bg_gradient": "linear-gradient(135deg, #2C1810 0%, #6B3A2A 100%)",
              "type": "Coffee"
            },
            "alts": [
              {
                "time": "8:30am",
                "name": "Market Lane Morning",
                "venue": "Market Lane Coffee, Prahran Market",
                "description": "Exceptional single origin in a beautiful market setting. Grab a pastry from the market stalls while you're there.",
                "tip": "The market itself is worth a slow wander after coffee.",
                "emoji": "☕",
                "dot_color": "terra",
                "bg_gradient": "linear-gradient(135deg, #2A1810 0%, #5A3020 100%)",
                "type": "Coffee"
              },
              {
                "time": "8:30am",
                "name": "Wide Open Road",
                "venue": "Wide Open Road, Brunswick",
                "description": "A Brunswick institution. Incredible natural light, great eggs, one of Melbourne's best flat whites.",
                "tip": "Arrive before 9am on weekends — it fills up fast.",
                "emoji": "☕",
                "dot_color": "terra",
                "bg_gradient": "linear-gradient(135deg, #1A1208 0%, #4A3018 100%)",
                "type": "Coffee"
              }
            ],
            "chosen_index": 0
          }
        ]
      },
      "sunday": {
        "theme": "Slow morning, long lunch",
        "slots": []
      }
    }
  ]
}

Fill all 3 plans fully with real, specific Melbourne content. Each plan needs a complete Saturday and Sunday with 2–4 slots each, all with 2 real alternatives.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",,
    max_tokens: 8000,
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
    model: "claude-sonnet-4-6",,
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
