"use client";

interface CorrectionCardProps {
  original: string;
  corrected: string;
  type: string;
  onDismiss: () => void;
}

export default function CorrectionCard({
  original,
  corrected,
  type,
  onDismiss,
}: CorrectionCardProps) {
  return (
    <div
      className="flex items-start justify-between gap-3 rounded-xl px-3 py-2 text-sm mt-1 max-w-[75%] ml-auto"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
        color: "var(--color-text-primary)",
      }}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="leading-snug">
          <span className="mr-1">💡</span>
          <span style={{ color: "var(--color-text-muted)" }}>Du meinst: </span>
          <strong>{corrected}</strong>
        </p>
        <p
          className="text-xs"
          style={{ color: "var(--color-text-faint)" }}
        >
          {type}
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss correction"
        className="shrink-0 text-base leading-none opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: "var(--color-text-primary)" }}
      >
        ×
      </button>
    </div>
  );
}
