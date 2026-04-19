"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

type DayType = "active" | "cultural" | "foodie" | "mixed";
type Budget  = "low" | "medium" | "high";

const DAY_TYPES: { id: DayType; label: string; sub: string; emoji: string }[] = [
  { id: "active",   emoji: "🌿", label: "Active",    sub: "Walks, trails, markets" },
  { id: "cultural", emoji: "🎨", label: "Cultural",  sub: "Galleries, wandering" },
  { id: "foodie",   emoji: "🍽", label: "Foodie",    sub: "Eating and drinking well" },
  { id: "mixed",    emoji: "🎲", label: "Mix it up", sub: "Surprise me" },
];

const BUDGETS: { id: Budget; label: string; sub: string }[] = [
  { id: "low",    label: "🌱 Thrifty",   sub: "Free & cheap wins" },
  { id: "medium", label: "⚖️ Balanced",  sub: "$40–100 per person" },
  { id: "high",   label: "✨ Splurge",   sub: "$100+ no worries" },
];

export default function QuickPage() {
  const router = useRouter();
  const [suburb,     setSuburb]     = useState("");
  const [partySize,  setPartySize]  = useState(2);
  const [dayType,    setDayType]    = useState<DayType>("mixed");
  const [budget,     setBudget]     = useState<Budget>("medium");
  const [avoidNotes, setAvoidNotes] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  async function handleBuild() {
    if (!suburb.trim()) { setError("Tell us your Melbourne suburb first."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: localStorage.getItem("weekendr_user_id"),
          quickProfile: { suburb, party_size: partySize, day_type: dayType, budget, avoid_notes: avoidNotes },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      localStorage.setItem("weekendr_user_id", data.userId);
      router.push("/plans");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSaving(false);
    }
  }

  if (saving) return <GeneratingScreen />;

  return (
    <main className="min-h-screen bg-paper flex flex-col">

      {/* Header */}
      <div className="sticky top-0 bg-paper/90 backdrop-blur-sm border-b border-smoke z-10">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-stone hover:text-ink transition-colors">
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="section-label">Build my weekend</div>
            <div className="font-display text-ink text-xl tracking-wide">4 QUICK QUESTIONS</div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-6 space-y-7 animate-slide-up">

        {/* Q1: Suburb */}
        <Field label="Where in Melbourne?" hint="Your suburb or area">
          <input
            type="text"
            value={suburb}
            onChange={e => setSuburb(e.target.value)}
            placeholder="e.g. Fitzroy, St Kilda, Richmond…"
            className="input-field"
            autoFocus
          />
        </Field>

        {/* Q2: Party size */}
        <Field label="How many of you?">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setPartySize(n)}
                className="w-11 h-11 rounded-xl border text-sm font-semibold transition-all"
                style={partySize === n ? {
                  background: "var(--ink)", color: "var(--yellow)", borderColor: "var(--ink)",
                } : {
                  background: "white", color: "var(--stone)", borderColor: "#E0DDD5",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>

        {/* Q3: Day type */}
        <Field label="What kind of day?">
          <div className="grid grid-cols-2 gap-2">
            {DAY_TYPES.map(d => (
              <button
                key={d.id}
                onClick={() => setDayType(d.id)}
                className="p-3 rounded-xl border text-left transition-all"
                style={dayType === d.id ? {
                  borderColor: "var(--terra)", background: "rgba(168,92,56,0.06)",
                } : {
                  borderColor: "#E0DDD5", background: "white",
                }}
              >
                <div className="text-xl mb-1">{d.emoji}</div>
                <div className="font-semibold text-ink text-sm">{d.label}</div>
                <div className="font-body text-stone text-xs mt-0.5" style={{ fontStyle: "italic" }}>{d.sub}</div>
              </button>
            ))}
          </div>
        </Field>

        {/* Q4: Budget */}
        <Field label="Budget?">
          <div className="space-y-2">
            {BUDGETS.map(b => (
              <button
                key={b.id}
                onClick={() => setBudget(b.id)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left"
                style={budget === b.id ? {
                  borderColor: "var(--terra)", background: "rgba(168,92,56,0.06)",
                } : {
                  borderColor: "#E0DDD5", background: "white",
                }}
              >
                <div>
                  <div className="font-semibold text-ink text-sm">{b.label}</div>
                  <div className="font-body text-stone text-xs" style={{ fontStyle: "italic" }}>{b.sub}</div>
                </div>
                {budget === b.id && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--terra)" }} />
                )}
              </button>
            ))}
          </div>
        </Field>

        {/* Optional: anything to avoid */}
        <Field label="Anything to avoid?" hint="Optional — dietary needs, mobility, preferences">
          <textarea
            value={avoidNotes}
            onChange={e => setAvoidNotes(e.target.value)}
            placeholder="e.g. vegetarian, no stairs, hate crowds…"
            className="input-field resize-none"
            rows={2}
          />
        </Field>

        {error && <p className="text-red-500 text-sm font-body" style={{ fontStyle: "italic" }}>{error}</p>}

        <button
          onClick={handleBuild}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin mr-2" /> Building…</>
          ) : "BUILD MY WEEKEND →"}
        </button>

        {/* Upsell to full setup */}
        <p className="text-center font-body text-stone text-xs pb-6" style={{ fontStyle: "italic" }}>
          Want plans every Friday automatically?{" "}
          <button
            onClick={() => router.push("/setup")}
            className="underline"
            style={{ color: "var(--terra)" }}
          >
            Set up your full profile
          </button>
        </p>

      </div>
    </main>
  );
}

// ── Generating screen ──────────────────────────────────────────────────────────

function GeneratingScreen() {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Reading the Melbourne forecast…",
    "Raiding our local knowledge…",
    "Finding the best spots in your area…",
    "Building your Saturday…",
    "Plotting a pretty good Sunday too…",
    "Adding a cheeky alternative or two…",
    "Nearly there…",
    "Your weekend is ready.",
  ];

  // Cycle through steps on a timer
  useState(() => {
    const interval = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, steps.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  });

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-8 text-center">
      <div className="animate-fade-in space-y-8">

        {/* Animated logo */}
        <div className="flex justify-center">
          <svg viewBox="0 0 120 80" width="90" height="60" xmlns="http://www.w3.org/2000/svg">
            <text x="2" y="44" fontFamily="'Bebas Neue', sans-serif" fontSize="44"
              fill="#FFE141" textLength="116" lengthAdjust="spacingAndGlyphs">WEEK</text>
            <text x="2" y="78" fontFamily="'Bebas Neue', sans-serif" fontSize="44"
              fill="#F7F4EE" textLength="116" lengthAdjust="spacingAndGlyphs">ENDR</text>
          </svg>
        </div>

        <div>
          <div
            className="font-display text-paper mb-3"
            style={{ fontSize: "52px", lineHeight: 0.9 }}
          >
            BUILDING<br />
            <span style={{ color: "var(--yellow)" }}>YOUR</span><br />
            WEEKEND.
          </div>
        </div>

        {/* Cycling status text */}
        <div
          key={stepIndex}
          className="font-body text-paper/50 text-sm animate-fade-in"
          style={{ fontStyle: "italic", minHeight: "24px" }}
        >
          {steps[stepIndex]}
        </div>

        {/* Subtle progress bar */}
        <div className="w-48 h-0.5 mx-auto rounded-full overflow-hidden" style={{ background: "rgba(247,244,238,0.1)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              background: "var(--yellow)",
              width: `${((stepIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

      </div>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="font-semibold text-ink text-sm">{label}</div>
        {hint && <div className="font-body text-stone text-xs mt-0.5" style={{ fontStyle: "italic" }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}
