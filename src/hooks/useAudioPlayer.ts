"use client";

import { useState, useRef, useCallback } from 'react';

interface UseAudioPlayerReturn {
  play: (text: string, voiceId: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  error: string | null;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const play = useCallback(async (text: string, voiceId: string): Promise<void> => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);
    setError(null);

    let objectUrl: string | null = null;

    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      const audio = new Audio(objectUrl);
      audioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('ended', () => {
          resolve();
        });

        audio.addEventListener('error', () => {
          reject(new Error('Audio playback error'));
        });

        audio.play().catch(reject);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown playback error';
      setError(message);
    } finally {
      if (objectUrl !== null) {
        URL.revokeObjectURL(objectUrl);
      }
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  return { play, stop, isSpeaking, error };
}
