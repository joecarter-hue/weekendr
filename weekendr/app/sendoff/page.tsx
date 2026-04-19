"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ConfirmedDay } from "@/types";

export default function SendOffPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<ConfirmedDay | null>(null);
  const [message,   setMessage]   = useState("");
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("weekendr_confirmed");
    if (!raw) { router.replace("/plans"); return; }

    const data: ConfirmedDay = JSON.parse(raw);
    setConfirmed(data);

    // Generate the Micky Flanagan message
    fetch("/api/sendoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed: data }),
    })
      .then(r => r.json())
      .then(d => setMessage(d.message || "Right then. Let's go."))
      .catch(() => setMessage("Right then. Let's go."))
      .finally(() => setLoading(false));
  }, [router]);

  function handleLetSGo() {
    // Store confirmed for day card
    router.push("/daycard");
  }

  if (!confirmed) return null;

  return (
    <main
      className="min-h-screen flex flex-col justify-between px-7 py-14"
      style={{ background: "var(--ink)" }}
    >
      {/* Plan identity */}
      <div className="animate-fade-in">
        <div className="section-label mb-2" style={{ color: "rgba(255,225,65,0.5)" }}>
          Your Saturday · {confirmed.plan_emoji} {confirmed.plan_name}
        </div>

        {/* Big headline */}
        <h1
          className="font-display text-paper leading-none mb-6"
          style={{ fontSize: "clamp(60px, 16vw, 88px)", lineHeight: 0.88 }}
        >
          YOU'RE<br />
          <span style={{ color: "var(--yellow)" }}>GOING</span><br />
          OUT.
        </h1>
      </div>

      {/* Micky message */}
      <div
        className="flex-1 flex items-center animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin flex-shrink-0"
              style={{ borderColor: "rgba(247,244,238,0.2)", borderTopColor: "var(--yellow)" }}
            />
            <span className="font-body text-paper/30 text-sm italic">
              Checking the vibe…
            </span>
          </div>
        ) : (
          <blockquote
            className="font-body text-paper/80 text-lg leading-relaxed animate-slide-up"
            style={{ fontStyle: "italic", borderLeft: "3px solid var(--yellow)", paddingLeft: "20px" }}
          >
            {message}
          </blockquote>
        )}
      </div>

      {/* Day summary pills */}
      <div className="space-y-2 mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="section-label" style={{ color: "rgba(247,244,238,0.25)" }}>Your day</div>
        {confirmed.activities.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
            style={{ background: "rgba(247,244,238,0.05)" }}
          >
            <span className="text-lg">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-paper text-sm truncate">{a.name}</div>
              <div className="font-body text-paper/40 text-xs italic truncate">{a.venue}</div>
            </div>
            <div className="font-display text-paper/30 text-sm tracking-wide flex-shrink-0">{a.time}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleLetSGo}
        className="btn-primary animate-fade-in"
        style={{ animationDelay: "0.4s", fontSize: "24px", padding: "20px 24px" }}
      >
        LET'S GO →
      </button>

    </main>
  );
}
