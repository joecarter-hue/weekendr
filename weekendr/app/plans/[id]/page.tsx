"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import type { WeekendPlan, Activity, ActivitySlot } from "@/types";

// ── Swipe threshold ───────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 80;

function SwipeBuilderContent() {
  const router   = useRouter();
  const params   = useParams();
  const search   = useSearchParams();
  const planId   = Number(params.id);

  const [plan,           setPlan]           = useState<WeekendPlan | null>(null);
  const [slots,          setSlots]          = useState<ActivitySlot[]>([]);
  const [slotIndex,      setSlotIndex]      = useState(0);
  const [confirmed,      setConfirmed]      = useState<Activity[]>([]);
  const [showOverlay,    setShowOverlay]    = useState(true);
  const [loading,        setLoading]        = useState(true);
  const [done,           setDone]           = useState(false);

  // Card drag state
  const cardRef   = useRef<HTMLDivElement>(null);
  const startX    = useRef(0);
  const currentX  = useRef(0);
  const dragging  = useRef(false);

  useEffect(() => {
    const userId = localStorage.getItem("weekendr_user_id");
    if (!userId) { router.replace("/"); return; }
    fetch(`/api/profile?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        const p: WeekendPlan = d.plans?.find((p: WeekendPlan) => p.id === planId);
        if (!p) { router.replace("/plans"); return; }
        setPlan(p);
        setSlots(p.saturday.slots);
      })
      .finally(() => setLoading(false));
    // Skip overlay if coming from lucky button
    if (search.get("swipe") === "1") setShowOverlay(false);
  }, [router, planId, search]);

  const currentSlot = slots[slotIndex];
  const currentAlt  = currentSlot
    ? [currentSlot.main, ...currentSlot.alts][currentSlot.chosen_index]
    : null;
  const nextAlt = slots[slotIndex + 1]
    ? [slots[slotIndex + 1].main, ...slots[slotIndex + 1].alts][slots[slotIndex + 1].chosen_index]
    : null;

  // ── Commit a decision ──────────────────────────────────────────────────────
  const commitDecision = useCallback((keep: boolean) => {
    if (!currentSlot || !currentAlt) return;

    if (keep) {
      setConfirmed(prev => [...prev, currentAlt]);
    } else {
      // Cycle to next alternative
      const maxAlts = currentSlot.alts.length;
      const nextIdx = (currentSlot.chosen_index + 1) % (maxAlts + 1);
      setSlots(prev => prev.map((s, i) =>
        i === slotIndex ? { ...s, chosen_index: nextIdx } : s
      ));
      return; // Don't advance index — show the swapped version
    }

    const next = slotIndex + 1;
    if (next >= slots.length) {
      setDone(true);
    } else {
      setSlotIndex(next);
    }
  }, [currentSlot, currentAlt, slotIndex, slots.length]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    startX.current = x;
    if (cardRef.current) cardRef.current.style.transition = "none";
  }, []);

  const onDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current || !cardRef.current) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    currentX.current = x - startX.current;
    const rotate = currentX.current * 0.07;
    cardRef.current.style.transform = `translateX(${currentX.current}px) rotate(${rotate}deg)`;

    // Show indicators
    const keep = cardRef.current.querySelector<HTMLElement>(".ind-keep");
    const swap = cardRef.current.querySelector<HTMLElement>(".ind-swap");
    const p = Math.min(Math.abs(currentX.current) / SWIPE_THRESHOLD, 1);
    if (keep) keep.style.opacity = currentX.current > 20 ? String(p) : "0";
    if (swap) swap.style.opacity = currentX.current < -20 ? String(p) : "0";
  }, []);

  const onDragEnd = useCallback(() => {
    if (!dragging.current || !cardRef.current) return;
    dragging.current = false;
    cardRef.current.style.transition = "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease";

    if (currentX.current > SWIPE_THRESHOLD) {
      cardRef.current.style.transform = "translateX(130%) rotate(20deg)";
      cardRef.current.style.opacity = "0";
      setTimeout(() => commitDecision(true), 300);
    } else if (currentX.current < -SWIPE_THRESHOLD) {
      cardRef.current.style.transform = "translateX(-130%) rotate(-20deg)";
      cardRef.current.style.opacity = "0";
      setTimeout(() => commitDecision(false), 300);
    } else {
      cardRef.current.style.transform = "translateX(0) rotate(0)";
      const keep = cardRef.current.querySelector<HTMLElement>(".ind-keep");
      const swap = cardRef.current.querySelector<HTMLElement>(".ind-swap");
      if (keep) keep.style.opacity = "0";
      if (swap) swap.style.opacity = "0";
    }
    currentX.current = 0;
  }, [commitDecision]);

  // Send to send-off
  useEffect(() => {
    if (!done || !plan) return;
    // Store confirmed activities in sessionStorage for the send-off screen
    sessionStorage.setItem("weekendr_confirmed", JSON.stringify({
      plan_name: plan.name,
      plan_emoji: plan.emoji,
      activities: confirmed,
    }));
    router.push("/sendoff");
  }, [done, plan, confirmed, router]);

  if (loading || !plan || !currentAlt) return <SwipeLoadingShell />;

  const dotColor = { terra: "#A85C38", sage: "#4A6955", amber: "#9B7A3A" };

  return (
    <main className="min-h-screen bg-paper flex flex-col select-none" onMouseMove={onDragMove} onMouseUp={onDragEnd}>

      {/* First-time overlay */}
      {showOverlay && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center px-8 text-center cursor-pointer"
          style={{ background: "rgba(28,24,20,0.93)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowOverlay(false)}
        >
          <div className="font-display text-paper text-4xl leading-none mb-3">
            BUILD YOUR<br /><span style={{ color: "var(--yellow)" }}>PERFECT DAY.</span>
          </div>
          <p className="font-body text-paper/50 text-sm italic mb-10 leading-relaxed">
            Each card is one part of your Saturday.<br />
            Keep what you love, swap what you don't.
          </p>
          <div className="flex gap-8 mb-10">
            {[
              { dir: "←", label: "SWAP IT",  sub: "Drag left for something else", color: "var(--terra)" },
              { dir: "→", label: "KEEP IT",  sub: "Drag right to lock it in",     color: "var(--sage)"  },
            ].map(g => (
              <div key={g.label} className="text-center w-28">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-2 flex items-center justify-center text-2xl border"
                  style={{ borderColor: g.color, background: `${g.color}22` }}
                >
                  {g.dir}
                </div>
                <div className="font-display text-sm tracking-wider" style={{ color: g.color }}>{g.label}</div>
                <div className="font-body text-paper/35 text-xs italic mt-1 leading-snug">{g.sub}</div>
              </div>
            ))}
          </div>
          <div
            className="font-body text-paper/30 text-xs italic animate-pulse-slow"
            style={{ letterSpacing: "1.5px", textTransform: "uppercase" }}
          >
            Tap anywhere to start →
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-start justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1 text-stone mb-2 -ml-1">
            <ChevronLeft size={18} /> <span className="text-xs font-medium">Plans</span>
          </button>
          <div className="section-label" style={{ color: "var(--terra)" }}>{plan.name}</div>
          <div className="font-display text-ink text-3xl tracking-wide">SATURDAY</div>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5 pt-10">
          {slots.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                height: "7px",
                width: i === slotIndex ? "20px" : "7px",
                background: i < slotIndex ? "var(--ink)" : i === slotIndex ? "var(--terra)" : "#D4D0C8",
              }}
            />
          ))}
        </div>
      </div>

      {/* Swipe hints */}
      <div className="flex justify-between px-8 mb-1">
        <span className="section-label" style={{ fontSize: "9px", color: "#C8C4BC" }}>← Swap it</span>
        <span className="section-label" style={{ fontSize: "9px", color: "#C8C4BC" }}>Keep it →</span>
      </div>

      {/* Card stage */}
      <div className="flex-1 px-5 flex items-center justify-center relative overflow-hidden">

        {/* Back card (next activity preview) */}
        {nextAlt && (
          <div
            className="absolute rounded-3xl overflow-hidden bg-white"
            style={{
              width: "calc(100% - 40px)",
              transform: "scale(0.94) translateY(14px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              zIndex: 1,
            }}
          >
            <ActivityCardInner activity={nextAlt} />
          </div>
        )}

        {/* Front card */}
        <div
          ref={cardRef}
          className="absolute rounded-3xl overflow-hidden bg-white cursor-grab active:cursor-grabbing"
          style={{
            width: "calc(100% - 40px)",
            boxShadow: "0 6px 28px rgba(0,0,0,0.10)",
            zIndex: 2,
            touchAction: "none",
          }}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          onTouchMove={e => { e.preventDefault(); onDragMove(e); }}
          onTouchEnd={onDragEnd}
        >
          <ActivityCardInner activity={currentAlt} />

          {/* Swipe indicators */}
          <div
            className="ind-keep absolute top-5 right-5 px-3 py-1.5 border-2 rounded-lg font-display text-xl tracking-widest"
            style={{ color: "var(--sage)", borderColor: "var(--sage)", opacity: 0, transform: "rotate(8deg)", pointerEvents: "none" }}
          >KEEP</div>
          <div
            className="ind-swap absolute top-5 left-5 px-3 py-1.5 border-2 rounded-lg font-display text-xl tracking-widest"
            style={{ color: "var(--terra)", borderColor: "var(--terra)", opacity: 0, transform: "rotate(-8deg)", pointerEvents: "none" }}
          >SWAP</div>
        </div>
      </div>

      {/* Day so far */}
      <div className="px-5 pt-3 pb-6" style={{ borderTop: "1px solid #EDEBE4", background: "#F7F4EE" }}>
        <div className="section-label mb-2">Your Saturday so far</div>
        {confirmed.length === 0 ? (
          <p className="font-body text-stone text-xs italic">Swipe right to build your day →</p>
        ) : (
          <div className="space-y-1.5">
            {confirmed.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 animate-slide-up">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor[a.dot_color as keyof typeof dotColor] || "#9A9288" }} />
                <span className="font-display text-stone text-xs tracking-wide w-14 flex-shrink-0">{a.time}</span>
                <span className="text-sm font-semibold text-ink truncate">{a.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}

// ── Fallback gradients derived from dot colour (used when bg_gradient absent) ──
const FALLBACK_BG: Record<string, string> = {
  terra: "linear-gradient(135deg, #2C1810 0%, #6B3A2A 100%)",
  sage:  "linear-gradient(135deg, #1A2820 0%, #2A4A38 100%)",
  amber: "linear-gradient(135deg, #2A2010 0%, #5A4020 100%)",
};

// ── Activity card inner content ────────────────────────────────────────────────

function ActivityCardInner({ activity }: { activity: Activity }) {
  const bg = activity.bg_gradient || FALLBACK_BG[activity.dot_color] || FALLBACK_BG.terra;
  return (
    <>
      {/* Image area */}
      <div className="relative h-52 overflow-hidden" style={{ background: bg }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(28,24,20,0.65) 100%)" }} />
        <div
          className="absolute top-3.5 left-3.5 font-display text-ink text-lg px-2.5 py-0.5 rounded"
          style={{ background: "var(--yellow)", letterSpacing: "0.5px" }}
        >
          {activity.time}
        </div>
        {activity.type && (
          <div

function SwipeLoadingShell() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-stone border-t-terra animate-spin" />
    </div>
  );
}

export default function SwipePage() {
  return <Suspense fallback={<SwipeLoadingShell />}><SwipeBuilderContent /></Suspense>;
}
