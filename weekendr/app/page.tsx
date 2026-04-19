"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

// ── The Weekendr logo as inline SVG (kerning-perfect) ─────────────────────────
function Logo({ size = 80 }: { size?: number }) {
  const h = size;
  const w = Math.round(size * 1.5);
  return (
    <svg viewBox="0 0 120 80" width={w} height={h} xmlns="http://www.w3.org/2000/svg">
      <text x="2" y="44" fontFamily="'Bebas Neue', sans-serif" fontSize="44"
        fill="#FFE141" textLength="116" lengthAdjust="spacingAndGlyphs">WEEK</text>
      <text x="2" y="78" fontFamily="'Bebas Neue', sans-serif" fontSize="44"
        fill="#F7F4EE" textLength="116" lengthAdjust="spacingAndGlyphs">ENDR</text>
    </svg>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // If the user already has a profile, skip straight to their plans
  useEffect(() => {
    const id = localStorage.getItem("weekendr_user_id");
    if (id) {
      router.replace("/plans");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) return null;

  return (
    <main className="min-h-screen bg-ink flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between px-7 pt-16 pb-10">

        {/* Logo */}
        <div className="animate-fade-in">
          <Logo size={72} />
        </div>

        {/* Headline */}
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h1
            className="font-display text-paper leading-none mb-4"
            style={{ fontSize: "clamp(64px, 18vw, 96px)", lineHeight: 0.88 }}
          >
            STOP<br />
            <span style={{ color: "var(--yellow)" }}>PLAN</span><br />
            NING.
          </h1>
          <p className="font-body text-paper/50 text-base leading-relaxed" style={{ fontStyle: "italic" }}>
            Every Friday, three curated Melbourne<br />
            weekends land in your inbox. Pick one. Just go.
          </p>
        </div>

        {/* CTAs */}
        <div
          className="flex flex-col gap-3 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Primary — large, dominant */}
          <button
            onClick={() => router.push("/setup")}
            className="btn-primary"
            style={{ fontSize: "22px", padding: "22px 24px" }}
          >
            SET UP MY WEEKENDS
          </button>

          {/* Secondary — clearly subordinate */}
          <button
            onClick={() => router.push("/quick")}
            className="flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
            style={{
              color: "rgba(247,244,238,0.45)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              padding: "12px 24px",
            }}
          >
            Or build my weekend now
            <ArrowRight size={14} style={{ opacity: 0.6 }} />
          </button>
        </div>

      </div>

      {/* ── Feature strip ────────────────────────────────────────────────── */}
      <div
        className="border-t px-7 py-6"
        style={{ borderColor: "rgba(247,244,238,0.07)" }}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: "🗓", label: "Every Friday", sub: "Plans in your inbox" },
            { icon: "📍", label: "Melbourne", sub: "Real local spots" },
            { icon: "🎲", label: "Zero fuss", sub: "Just pick and go" },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-xl mb-1">{f.icon}</div>
              <div
                className="font-display text-paper text-sm"
                style={{ letterSpacing: "0.5px" }}
              >
                {f.label}
              </div>
              <div className="font-body text-paper/35 text-xs mt-0.5" style={{ fontStyle: "italic" }}>
                {f.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <p
          className="text-center mt-5 font-body text-paper/20 text-xs"
          style={{ letterSpacing: "1.5px", fontStyle: "italic" }}
        >
          Friday plans. Weekend memories.
        </p>
      </div>

    </main>
  );
}
