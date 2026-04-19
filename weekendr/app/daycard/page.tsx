"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Share2 } from "lucide-react";
import type { ConfirmedDay, Activity } from "@/types";

const DOT: Record<string, string> = {
  terra: "#A85C38", sage: "#4A6955", amber: "#9B7A3A",
};

export default function DayCardPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<ConfirmedDay | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("weekendr_confirmed");
    if (!raw) { router.replace("/plans"); return; }
    setConfirmed(JSON.parse(raw));
  }, [router]);

  if (!confirmed) return null;

  const { activities, plan_name, plan_emoji } = confirmed;

  // Build Google Maps URL: waypoints in order
  const mapsUrl = buildMapsUrl(activities);

  // Build share text
  const shareText = `${plan_emoji} ${plan_name} this Saturday:\n` +
    activities.map(a => `${a.time} — ${a.name} (${a.venue})`).join("\n") +
    "\n\nBuilt with Weekendr 🗓";

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: `My Saturday — ${plan_name}`, text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("Copied to clipboard — paste it anywhere.");
    }
  }

  return (
    <main className="min-h-screen bg-ink flex flex-col">

      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <div className="section-label mb-1" style={{ color: "rgba(255,225,65,0.5)" }}>
          {plan_emoji} {plan_name}
        </div>
        <h1
          className="font-display text-paper leading-none"
          style={{ fontSize: "clamp(52px,14vw,72px)", lineHeight: 0.88 }}
        >
          YOUR<br /><span style={{ color: "var(--yellow)" }}>SATUR</span><br />DAY.
        </h1>
        <p className="font-body text-paper/35 text-sm italic mt-2">
          {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Timeline */}
      <div className="flex-1 px-6 py-2 relative">

        {/* Vertical line */}
        <div
          className="absolute top-6 bottom-6 w-px"
          style={{ left: "38px", background: "rgba(247,244,238,0.08)" }}
        />

        <div className="space-y-5">
          {activities.map((a, i) => (
            <div key={i} className="flex gap-4 items-start animate-slide-up" style={{ animationDelay: `${i * 0.07}s` }}>
              {/* Dot */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 z-10"
                style={{ background: DOT[a.dot_color] || "#9A9288", marginTop: "2px" }}
              >
                {a.emoji}
              </div>
              {/* Content */}
              <div className="flex-1 pb-2" style={{ borderBottom: i < activities.length - 1 ? "1px solid rgba(247,244,238,0.06)" : "none" }}>
                <div className="font-display text-paper/35 text-xs tracking-widest mb-0.5">{a.time}</div>
                <div className="font-display text-paper text-xl leading-tight">{a.name}</div>
                <div className="font-body text-paper/45 text-xs italic">{a.venue}</div>
                {a.tip && (
                  <div
                    className="mt-2 font-body text-xs italic leading-snug px-2.5 py-1.5 rounded-r-md"
                    style={{ borderLeft: "2px solid var(--yellow)", color: "rgba(255,225,65,0.6)", background: "rgba(255,225,65,0.04)" }}
                  >
                    {a.tip}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-6 space-y-3">

        {/* Google Maps */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 font-display tracking-wider text-lg transition-all active:scale-[0.98]"
          style={{ background: "var(--yellow)", color: "var(--ink)" }}
        >
          <MapPin size={18} />
          OPEN ROUTE IN MAPS
        </a>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 font-display tracking-wider text-lg border transition-all active:scale-[0.98]"
          style={{ borderColor: "rgba(247,244,238,0.15)", color: "var(--paper)", background: "transparent" }}
        >
          <Share2 size={18} />
          SHARE WITH A LOVED ONE
        </button>

        {/* View postcard */}
        <button
          onClick={() => router.push("/postcard")}
          className="w-full text-center font-body text-paper/30 text-sm italic py-2 transition-colors hover:text-paper/50"
        >
          View weekend postcard →
        </button>

      </div>

    </main>
  );
}

// ── Build a Google Maps directions URL with all stops as waypoints ─────────────

function buildMapsUrl(activities: Activity[]): string {
  if (!activities.length) return "https://maps.google.com";
  const venues = activities.map(a => encodeURIComponent(a.venue));
  if (venues.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${venues[0]}`;
  }
  const origin = venues[0];
  const destination = venues[venues.length - 1];
  const waypoints = venues.slice(1, -1).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=driving`;
}
