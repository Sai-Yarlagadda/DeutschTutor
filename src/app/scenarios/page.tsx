import Link from "next/link";
import { getAllScenarios, Scenario } from "@/lib/scenarios";

export default function ScenariosPage() {
  const scenarios: Scenario[] = getAllScenarios();

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1
        className="text-3xl font-bold mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        Wo möchtest du heute sprechen?
      </h1>
      <p className="mb-10" style={{ color: "var(--color-text-muted)" }}>
        Where do you want to talk today?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/personas?scenario=${scenario.id}`}
            className="selection-card block rounded-xl p-6"
          >
            <div className="text-5xl mb-4">{scenario.icon}</div>
            <h2
              className="text-xl font-bold mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              {scenario.nameDE}
            </h2>
            <p
              className="text-sm mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              {scenario.name}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              {scenario.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
