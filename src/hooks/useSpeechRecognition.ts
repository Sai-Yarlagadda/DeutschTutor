"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Inline Web Speech API type declarations ──────────────────────────────────
// These types are not included in @types/node or the default TS lib.

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;

  start(): void;
  stop(): void;
  abort(): void;

  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// ── Augment the Window interface ─────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ── Hook return type ─────────────────────────────────────────────────────────
export interface UseSpeechRecognitionReturn {
  /** Final confirmed transcript from the last utterance */
  transcript: string;
  /** Live partial transcript while the user is still speaking */
  interimTranscript: string;
  /** Whether the microphone is actively listening */
  isListening: boolean;
  /** Start capturing speech (resets transcript first) */
  startListening: () => void;
  /** Stop capturing speech */
  stopListening: () => void;
  /** Error message, or null if none */
  error: string | null;
  /** False when the browser does not support the Web Speech API */
  isSupported: boolean;
}

// ── Hook implementation ──────────────────────────────────────────────────────
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Detect support once on the client (window is not available during SSR).
  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (final) {
        setTranscript((prev) => (prev ? `${prev} ${final}`.trim() : final.trim()));
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "aborted" fires when we call stop() manually — not a real error.
      if (event.error !== "aborted") {
        setError(event.error ?? "Unknown speech recognition error");
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    const forceRelease = () => recognition.abort();
    window.addEventListener("beforeunload", forceRelease);
    window.addEventListener("pagehide", forceRelease);

    return () => {
      window.removeEventListener("beforeunload", forceRelease);
      window.removeEventListener("pagehide", forceRelease);
      recognition.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    // Reset before starting a new utterance.
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      // InvalidStateError is thrown if recognition is already running.
      setError(err instanceof Error ? err.message : "Could not start speech recognition");
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore errors when stopping (e.g. already stopped).
    }
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    error,
    isSupported,
  };
}
