"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UseAmbientAudioReturn {
  play: () => void;
  pause: () => void;
  setVolume: (vol: number) => void;
  isPlaying: boolean;
}

export function useAmbientAudio(audioFile: string): UseAmbientAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.25;
    audio.src = `/audio/${audioFile}`;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [audioFile]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setIsPlaying(false);
      }
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  return { play, pause, setVolume, isPlaying };
}
