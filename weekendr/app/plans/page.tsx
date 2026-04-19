"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { WeekendPlan } from "@/types";

type Mood = "recharge" | "explore" | "celebrate";

const MOODS: { id: Mood; emoji: string; label: string }[] = [
  { id: "recharge",  emoji: "🧘", label: "Recharge" },
  { id: "explore",   emoji: "🗺", label: "Explore" },
  { id: "celebrate", emoji: "🥂", label: "Celebrate" },
];

const CARD_COLORS = ["terra", "sage", "amber"] as const;

function PlansContent() {
  const router = useRouter();
  const params = useSearchParams();
  const lucky = params.get("lucky") === "1";

  const [plans, setPlans]     = useState<WeekendPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood]       = useState<Mood>("explore");
  const [error, setError]     = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("weekendr_user_id");
    if (!userId) { router.replace("/"); return; }

    fetch(`/api/profile?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.plans) {
          setPlans(d.plans);
          if (lucky) {
            const pick = d.plans[Math.floor(Math.random() * d.plans.length)];
            router.push(`/plans/${pick.id}?swipe=1`);
          }
        } else {
          setError("No plans found — let's generate some.");
        }
      })
      .catch(() => setError("Couldn't load your plans."))
      .finally(() => setLoading(false));
  }, [router, lucky]);

  // Sort plans by mood alignment
  const sorted = [...plans].sort((a, b) => {
    const aMatch = a.moods?.includes(mood) ? 0 : 1;
    const bMatch = b.moods?.includes(mood) ? 0 : 1;
    return aMatch - bMatch;
  });

  if (loading) return <LoadingShell />;

  if (error) return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-8 text-center">
      <div className="space-y-4">
        <p className="font-body text-paper/50 text-sm italic">{error}</p>
        <button onClick={() => router.push("/quick")} className="btn-primary" style={{ width: "auto", padding: "14px 28px" }}>
          BUILD MY WEEKEND →
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-ink flex flex-col">

      {/* Header */}
      <div className="px-6 pt-14 pb-5">
        {/* Logo small */}
        <svg viewBox="0 0 80 54" width="56" height="38" xmlns="http://www.w3.org/2000/svg" className="mb-6">
          <text x="1" y="30" fontFamily="'Bebas Neue',sans-serif" fontSize="30" fill="#FFE141" textLength="78" lengthAdjust="spacingAndGlyphs">WEEK</text>
          <text x="1" y="53" fontFamily="'Bebas Neue',sans-serif" fontSize="30" fill="#F7F4EE" textLength="78" lengthAdjust="spacingAndGlyphs">ENDR</text>
        </svg>

        <div className="section-label mb-1" style={{ color: "rgba(247,244,238,0.3)" }}>
          Your weekend · {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long" })}
        </div>
        <h1 className="font-display text-paper text-4xl tracking-wide mb-1">3 OPTIONS.</h1>
        <p className="font-body text-paper/40 text-sm italic">Pick one. Just go.</p>
      </div>

      {/* Mood selector */}
      <div className="px-6 mb-5">
        <div className="section-label mb-2" style={{ color: "rgba(247,244,238,0.25)" }}>
          What kind of weekend do you need?
        </div>
        <div className="flex gap-2">
          {MOODS.map(m => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className="flex-1 py-3 rounded-xl border transition-all text-center"
              style={mood === m.id ? {
                borderColor: "var(--yellow)",
                background: "rgba(255,225,65,0.08)",
              } : {
                borderColor: "rgba(247,244,238,0.1)",
                background: "transparent",
              }}
            >
              <div className="text-xl mb-0.5">{m.emoji}</div>
              <div
                className="text-xs font-semibold"
                style={{ color: mood === m.id ? "var(--yellow)" : "rgba(247,244,238,0.4)" }}
              >
                {m.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="px-6 space-y-3 flex-1">
        {sorted.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            color={CARD_COLORS[i % 3]}
            onSelect={() => router.push(`/plans/${plan.id}`)}
          />
        ))}
      </div>

      {/* I'm Feeling Lucky */}
      <div className="px-6 py-6">
        <button
          onClick={() => {
            const pick = plans[Math.floor(Math.random() * plans.length)];
            router.push(`/plans/${pick.id}?swipe=1`);
          }}
          className="w-full border rounded-2xl py-4 flex items-center justify-center gap-3 transition-all"
          style={{
            borderColor: "rgba(255,225,65,0.25)",
            background: "transparent",
          }}
        >
          <span className="text-xl">🎲</span>
          <div className="text-left">
            <div className="font-display text-yellow text-lg tracking-wide">I'M FEELING LUCKY</div>
            <div className="font-body text-paper/35 text-xs italic">Just pick one for me</div>
          </div>
        </button>
      </div>

    </main>
  );
}

// ── Plan card ──────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  color,
  onSelect,
}: {
  plan: WeekendPlan;
  color: "terra" | "sage" | "amber";
  onSelect: () => void;
}) {
  const bg = { terra: "var(--terra)", sage: "var(--sage)", amber: "var(--amber)" }[color];

  return (
    <button
      onClick={onSelect}
      className="w-full rounded-2xl overflow-hidden text-left transition-all active:scale-[0.99]"
      style={{ background: bg }}
    >
      {/* Subtle texture overlay */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)" }}
      >
        <div>
          <div className="section-label mb-1" style={{ color: "rgba(247,244,238,0.55)", fontSize: "9px" }}>
            {plan.vibe}
          </div>
          <div className="font-display text-paper text-2xl tracking-wide leading-none mb-1">
            {plan.name}
          </div>
          <div className="font-body text-paper/60 text-xs italic">{plan.tagline}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
          <span className="text-2xl">{plan.emoji}</span>
          <span className="text-paper/40 text-lg">→</span>
        </div>
      </div>
      {/* Cost strip */}
      <div
        className="px-5 py-2 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.15)" }}
      >
        <span className="font-body text-paper/50 text-xs italic">
          Perfect for {plan.perfect_for}
        </span>
        <span className="font-display text-paper/60 text-xs tracking-wide">
          {plan.estimated_cost}
        </span>
      </div>
    </button>
  );
}

// ── Loading shell ──────────────────────────────────────────────────────────────

function LoadingShell() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="space-y-4 text-center animate-pulse">
        <svg viewBox="0 0 120 80" width="80" height="54" xmlns="http://www.w3.org/2000/svg">
          <text x="2" y="44" fontFamily="'Bebas Neue',sans-serif" fontSize="44" fill="#FFE141" opacity="0.3" textLength="116" lengthAdjust="spacingAndGlyphs">WEEK</text>
          <text x="2" y="78" fontFamily="'Bebas Neue',sans-serif" fontSize="44" fill="#F7F4EE" opacity="0.3" textLength="116" lengthAdjust="spacingAndGlyphs">ENDR</text>
        </svg>
      </div>
    </div>
  );
}

export default function PlansPage() {
  return <Suspense fallback={<LoadingShell />}><PlansContent /></Suspense>;
}
