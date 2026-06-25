import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
      <h1
        className="text-5xl font-bold mb-4"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-accent)" }}
      >
        DeutschTutor
      </h1>
      <p className="text-xl mb-2" style={{ color: "var(--color-text-primary)" }}>
        Speak German like a local.
      </p>
      <p className="mb-10 max-w-md" style={{ color: "var(--color-text-muted)" }}>
        Have real conversations with German-speaking personas from Hamburg, Berlin,
        Munich, and Vienna — in the places they actually live.
      </p>
      <Link
        href="/scenarios"
        className="px-8 py-3 rounded-lg font-semibold text-sm transition-colors"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "#0f0f0f",
        }}
      >
        Gespräch beginnen →
      </Link>
    </div>
  );
}
