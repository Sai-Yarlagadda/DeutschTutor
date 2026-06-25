"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CorrectionCard from "@/components/CorrectionCard";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { getPersona, type Persona } from "@/lib/personas";
import { getScenario, type Scenario } from "@/lib/scenarios";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Correction {
  original: string;
  corrected: string;
  type: string;
}

type CallPhase =
  | "ringing"    // showing call screen, ringtone playing
  | "connected"  // active call, auto-listening
  | "listening"  // user is speaking
  | "processing" // waiting for AI response
  | "correcting" // AI is speaking a correction
  | "responding" // AI is speaking its reply
  | "ended";     // call ended

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAIReply(raw: string): { text: string; correction: Correction | null } {
  const correctionRegex = /\s*\{"correction":\{[^}]+\}\}\s*$/;
  const match = raw.match(correctionRegex);
  if (!match) return { text: raw, correction: null };

  const jsonStr = match[0].trim();
  const text = raw.slice(0, raw.length - match[0].length).trimEnd();

  try {
    const parsed = JSON.parse(jsonStr) as {
      correction: { original: string; corrected: string; type: string };
    };
    const { original, corrected, type } = parsed.correction;
    if (
      typeof original === "string" &&
      typeof corrected === "string" &&
      typeof type === "string"
    ) {
      return { text, correction: { original, corrected, type } };
    }
  } catch {
    // malformed JSON — ignore
  }
  return { text: raw, correction: null };
}

// Generate a phone ringtone using Web Audio API
function playRingtone(ctx: AudioContext): () => void {
  let stopped = false;
  let timeout: ReturnType<typeof setTimeout>;

  function ring() {
    if (stopped) return;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.frequency.value = 480;
    osc2.frequency.value = 620;
    osc1.type = "sine";
    osc2.type = "sine";

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.35);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);

    // Ring again after a pause
    timeout = setTimeout(ring, 1400);
  }

  ring();
  return () => {
    stopped = true;
    clearTimeout(timeout);
  };
}

// Play a short "call connected" click/beep
function playConnectSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

// ── Status label ──────────────────────────────────────────────────────────────

function statusLabel(phase: CallPhase): string {
  switch (phase) {
    case "ringing":    return "Anrufen…";
    case "connected":  return "Verbunden";
    case "listening":  return "Ich höre zu…";
    case "processing": return "Einen Moment…";
    case "correcting": return "Korrektur…";
    case "responding": return "Spricht…";
    case "ended":      return "Anruf beendet";
  }
}

// ── Main inner component ──────────────────────────────────────────────────────

function ConversationPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const personaId  = searchParams.get("persona")  ?? "";
  const scenarioId = searchParams.get("scenario") ?? "";

  const persona: Persona | undefined  = getPersona(personaId);
  const scenario: Scenario | undefined = getScenario(scenarioId);

  // ── State ──────────────────────────────────────────────────────────────────

  const [phase, setPhase]             = useState<CallPhase>("ringing");
  const [messages, setMessages]       = useState<Message[]>([]);
  const [corrections, setCorrections] = useState<Record<number, Correction>>({});
  const [transcript, setDisplayTranscript] = useState("");
  const [showLog, setShowLog]         = useState(false);
  const [currentCorrection, setCurrentCorrection] = useState<Correction | null>(null);

  const audioCtxRef  = useRef<AudioContext | null>(null);
  const stopRingRef  = useRef<(() => void) | null>(null);
  const hasGreeted   = useRef(false);

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const stt = useSpeechRecognition();
  const audioPlayer = useAudioPlayer();
  const ambient = useAmbientAudio(scenario?.audioFile ?? "");

  // Keep latest refs so the beforeunload handler can access them without stale closures
  const sttRef         = useRef(stt);
  const audioPlayerRef = useRef(audioPlayer);
  const ambientRef     = useRef(ambient);
  sttRef.current         = stt;
  audioPlayerRef.current = audioPlayer;
  ambientRef.current     = ambient;

  // ── Boot: start ringing ────────────────────────────────────────────────────

  useEffect(() => {
    if (!persona || !scenario) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    stopRingRef.current = playRingtone(ctx);

    // Auto-answer after 2.5 s, then play opening greeting
    const timer = setTimeout(() => {
      stopRingRef.current?.();
      playConnectSound(ctx);
      ambient.play();
      fetchGreeting();
    }, 2500);

    return () => {
      clearTimeout(timer);
      stopRingRef.current?.();
      ctx.close();
      ambient.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Release mic + audio when the tab is closed or navigated away ─────────

  useEffect(() => {
    const release = () => {
      sttRef.current.stopListening();
      audioPlayerRef.current.stop();
      ambientRef.current.pause();
      audioCtxRef.current?.close();
    };
    window.addEventListener("beforeunload", release);
    window.addEventListener("pagehide", release);
    return () => {
      window.removeEventListener("beforeunload", release);
      window.removeEventListener("pagehide", release);
    };
  }, []);

  // ── Auto-listen when connected ─────────────────────────────────────────────

  useEffect(() => {
    if (phase === "connected" && stt.isSupported && !stt.isListening) {
      stt.startListening();
      setPhase("listening");
    }
  // Depend on primitives, not the whole stt object — avoids firing on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stt.isListening, stt.isSupported]);

  // ── Detect end of speech → send ────────────────────────────────────────────

  const prevListening = useRef(false);
  useEffect(() => {
    if (prevListening.current && !stt.isListening && stt.transcript) {
      setDisplayTranscript(stt.transcript);
      setPhase("processing");
      sendMessage(stt.transcript);
    }
    prevListening.current = stt.isListening;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.isListening, stt.transcript]);

  // ── Opening greeting ───────────────────────────────────────────────────────

  const fetchGreeting = useCallback(async () => {
    if (hasGreeted.current || !persona || !scenario) return;
    hasGreeted.current = true;

    setPhase("processing");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: {
            name: persona.name,
            age: persona.age,
            city: persona.city,
            occupation: persona.occupation,
            scenario: scenario.name,
            personality: persona.personality,
          },
          userMessage: "[CONVERSATION_START]",
          history: [],
          userLevel: "A2",
          memoryContext: `IMPORTANT: This is the very opening of the conversation. The user has just arrived. Greet them warmly and naturally in German with 1–2 short sentences, as ${persona.name} would in a real ${scenario.name} setting. Do not reference "[CONVERSATION_START]". Do not wait for them to speak first.`,
        }),
      });

      if (!res.ok || !res.body) { setPhase("connected"); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }

      const { text: greetingText } = parseAIReply(full);
      // Add greeting to message log (no user message shown)
      setMessages([{ role: "assistant", content: greetingText }]);

      setPhase("responding");
      ambient.pause();
      try {
        await audioPlayer.play(greetingText, persona.voiceId);
      } catch { /* swallow TTS errors */ }
      finally {
        ambient.play();
      }
    } catch { /* network error */ }
    finally {
      setPhase("connected"); // triggers auto-listen
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, scenario, audioPlayer, ambient]);

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !persona) return;

    const newHistory: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newHistory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: {
            name: persona.name,
            age: persona.age,
            city: persona.city,
            occupation: persona.occupation,
            scenario: scenario?.name ?? "",
            personality: persona.personality,
          },
          userMessage: trimmed,
          history: messages,
          userLevel: "A2",
        }),
      });

      if (!res.ok || !res.body) {
        setPhase("connected");
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }

      const { text: cleanedText, correction } = parseAIReply(full);

      setMessages((prev) => {
        const next: Message[] = [...prev, { role: "assistant" as const, content: cleanedText }];
        if (correction !== null) {
          const userIndex = next.length - 2;
          setCorrections((c) => ({ ...c, [userIndex]: correction }));
        }
        return next;
      });

      // TTS — speak correction aloud first, then the AI's reply
      ambient.pause();
      if (correction) {
        setCurrentCorrection(correction);
        setPhase("correcting");
        const correctionSpeech = `Stopp mal kurz. Du hast "${correction.original}" gesagt. Richtig ist: "${correction.corrected}".`;
        try {
          await audioPlayer.play(correctionSpeech, persona.voiceId);
        } catch { /* swallow */ }
      }
      setPhase("responding");
      try {
        await audioPlayer.play(cleanedText, persona.voiceId);
      } catch { /* swallow */ }
      finally {
        ambient.play();
        setCurrentCorrection(null);
      }

    } catch {
      // network error — fall through
    } finally {
      // Auto-listen again after responding
      setDisplayTranscript("");
      setPhase("connected");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, persona, scenario, audioPlayer, ambient]);

  // ── End call ───────────────────────────────────────────────────────────────

  async function endCall() {
    stt.stopListening();
    audioPlayer.stop();
    ambient.pause();
    setPhase("ended");

    if (messages.length > 0) {
      await fetch("/api/memory/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          persona: persona?.name ?? "",
          scenario: scenario?.name ?? "",
          messages,
        }),
      }).catch(() => {});
    }

    setTimeout(() => router.push("/scenarios"), 1200);
  }

  // ── Invalid state ──────────────────────────────────────────────────────────

  if (!persona || !scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4"
        style={{ color: "var(--color-text-muted)" }}>
        <p>Ungültige Auswahl.</p>
        <a href="/scenarios" style={{ color: "var(--color-accent)" }}>← Zurück zu Szenarien</a>
      </div>
    );
  }

  // ── Avatar pulse class ─────────────────────────────────────────────────────

  const isAISpeaking  = phase === "responding" || phase === "correcting";
  const isUserSpeaking = phase === "listening" && stt.interimTranscript.length > 0;

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col items-center justify-between h-[calc(100dvh-57px)] px-6 py-10 select-none"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      {/* ── Top: scenario + log toggle ── */}
      <div className="flex w-full items-center justify-between">
        <span className="text-sm" style={{ color: "var(--color-text-faint)" }}>
          {scenario.icon} {scenario.nameDE}
        </span>
        <button
          onClick={() => setShowLog((v) => !v)}
          className="text-xs px-3 py-1 rounded-full"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          {showLog ? "Anruf" : "Verlauf"}
        </button>
      </div>

      {showLog ? (
        /* ── Conversation log view ── */
        <div className="flex-1 w-full max-w-lg overflow-y-auto py-4 space-y-3 mt-4">
          {messages.length === 0 && (
            <p className="text-center text-sm" style={{ color: "var(--color-text-faint)" }}>
              Noch keine Nachrichten.
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="flex flex-col">
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                  style={
                    msg.role === "user"
                      ? { backgroundColor: "var(--color-accent)", color: "#0f0f0f", borderBottomRightRadius: "4px" }
                      : { backgroundColor: "var(--color-bg-raised)", color: "var(--color-text-primary)", borderBottomLeftRadius: "4px" }
                  }
                >
                  {msg.role === "assistant" && (
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-accent)" }}>
                      {persona.name}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
              {msg.role === "user" && corrections[i] && (
                <div className="flex justify-end mt-1">
                  <CorrectionCard
                    original={corrections[i].original}
                    corrected={corrections[i].corrected}
                    type={corrections[i].type}
                    onDismiss={() =>
                      setCorrections((prev) => {
                        const next = { ...prev };
                        delete next[i];
                        return next;
                      })
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Phone call view ── */
        <div className="flex flex-col items-center gap-6 flex-1 justify-center">

          {/* Avatar with pulse rings */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulse — AI speaking */}
            {isAISpeaking && (
              <>
                <div
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: 160, height: 160,
                    backgroundColor: "var(--color-accent)",
                    opacity: 0.15,
                  }}
                />
                <div
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: 140, height: 140,
                    backgroundColor: "var(--color-accent)",
                    opacity: 0.2,
                    animationDelay: "0.3s",
                  }}
                />
              </>
            )}

            {/* Ringing pulse */}
            {phase === "ringing" && (
              <>
                <div
                  className="absolute rounded-full animate-ping"
                  style={{ width: 160, height: 160, backgroundColor: "#4ade80", opacity: 0.15 }}
                />
                <div
                  className="absolute rounded-full animate-ping"
                  style={{ width: 130, height: 130, backgroundColor: "#4ade80", opacity: 0.2, animationDelay: "0.5s" }}
                />
              </>
            )}

            {/* User speaking ring */}
            {isUserSpeaking && (
              <div
                className="absolute rounded-full animate-ping"
                style={{ width: 150, height: 150, backgroundColor: "#60a5fa", opacity: 0.2 }}
              />
            )}

            {/* Avatar circle */}
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold z-10 transition-all duration-300"
              style={{
                backgroundColor: phase === "ringing" ? "#1a2e1a" : "var(--color-bg-surface)",
                border: `3px solid ${isAISpeaking ? "var(--color-accent)" : isUserSpeaking ? "#60a5fa" : "var(--color-border)"}`,
                color: "var(--color-accent)",
                boxShadow: isAISpeaking ? "0 0 32px rgba(212,160,23,0.3)" : "none",
              }}
            >
              {persona.name.charAt(0)}
            </div>
          </div>

          {/* Name + occupation */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
              {persona.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {persona.occupation} · {persona.city}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
              {statusLabel(phase)}
            </span>
            {(phase === "ringing" || phase === "processing") && (
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </span>
            )}
          </div>

          {/* Correction banner */}
          {currentCorrection && (
            <div
              className="max-w-xs w-full rounded-2xl px-4 py-3 text-sm text-center"
              style={{
                backgroundColor: "#1c1400",
                border: "1px solid var(--color-accent)",
                color: "var(--color-text-primary)",
              }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-accent)" }}>
                Korrektur
              </p>
              <p>
                <span style={{ color: "#f87171", textDecoration: "line-through" }}>
                  {currentCorrection.original}
                </span>
                {" → "}
                <span style={{ color: "#4ade80", fontWeight: 600 }}>
                  {currentCorrection.corrected}
                </span>
              </p>
            </div>
          )}

          {/* Live transcript */}
          {(stt.interimTranscript || transcript) && phase !== "ringing" && !currentCorrection && (
            <div
              className="max-w-xs text-center text-sm px-4 py-2 rounded-xl"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              {stt.interimTranscript || transcript}
            </div>
          )}
        </div>
      )}

      {/* ── End call button ── */}
      <button
        onClick={endCall}
        disabled={phase === "ended"}
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200 disabled:opacity-40"
        style={{
          backgroundColor: phase === "ended" ? "var(--color-bg-surface)" : "#dc2626",
          boxShadow: phase === "ended" ? "none" : "0 4px 20px rgba(220,38,38,0.4)",
        }}
        aria-label="Anruf beenden"
      >
        📵
      </button>
    </div>
  );
}

// ── Page export with Suspense ─────────────────────────────────────────────────

export default function ConversationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-muted)" }}>
          Wird geladen…
        </div>
      }
    >
      <ConversationPageInner />
    </Suspense>
  );
}
