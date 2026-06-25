"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPersonasByScenario, getAllPersonas, Persona } from "@/lib/personas";
import { getScenario } from "@/lib/scenarios";

function PersonasContent() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenario") ?? "";

  const scenario = scenarioId ? getScenario(scenarioId) : undefined;
  const personas: Persona[] = scenarioId
    ? getPersonasByScenario(scenarioId)
    : getAllPersonas();

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href="/scenarios"
        className="inline-flex items-center text-sm mb-6 transition-colors duration-150"
        style={{ color: "var(--color-text-muted)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color =
            "var(--color-text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color =
            "var(--color-text-muted)";
        }}
      >
        ← Back
      </Link>

      {/* Scenario subtitle */}
      {scenario && (
        <p
          className="text-lg mb-2"
          style={{ color: "var(--color-accent)" }}
        >
          {scenario.icon} {scenario.nameDE}
        </p>
      )}

      {/* Page heading */}
      <h1
        className="text-3xl font-bold mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        Wer hilft dir heute?
      </h1>
      <p className="mb-10" style={{ color: "var(--color-text-muted)" }}>
        Who helps you today?
      </p>

      {/* Persona cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <Link
            key={persona.id}
            href={`/conversation?scenario=${scenarioId}&persona=${persona.id}`}
            className="selection-card block rounded-xl p-6"
          >
            {/* Avatar circle */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-4"
              style={{
                background: "var(--color-accent)",
                color: "#0f0f0f",
              }}
            >
              {persona.name.charAt(0)}
            </div>

            {/* Name */}
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              {persona.name}
            </h2>

            {/* Age + city */}
            <p
              className="text-sm mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {persona.age} · {persona.city}
            </p>

            {/* Occupation */}
            <p
              className="text-sm mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              {persona.occupation}
            </p>

            {/* Region badge */}
            <span
              className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mr-2"
              style={{
                background: "var(--color-bg-raised)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              {persona.region}
            </span>

            {/* Voice type */}
            <span
              className="text-xs"
              style={{ color: "var(--color-text-faint)" }}
            >
              {persona.voiceType}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function PersonasPage() {
  return (
    <Suspense
      fallback={
        <div
          className="px-6 py-16 max-w-5xl mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          Loading…
        </div>
      }
    >
      <PersonasContent />
    </Suspense>
  );
}
