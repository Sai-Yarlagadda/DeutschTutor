export type VoiceId = string;

export const VOICE_MAP: Record<string, VoiceId> = {
  'railway-employee':       'EXAVITQu4vr4xnSDxMaL', // Sarah — mature professional female
  'berlin-student':         'IKne3meq5aSn9XLyUdCD', // Charlie — young energetic male
  'bavarian-grandma':       'XrExE9yKIg1WjnnlVkGX', // Matilda — warm knowledgeable female
  'austrian-receptionist':  'Xb7hH8MSUJpSbSDYk0k2', // Alice — clear professional female
};

// Fallback voice if persona ID not found
export const DEFAULT_VOICE_ID: VoiceId = 'EXAVITQu4vr4xnSDxMaL';

export function getVoiceId(personaId: string): VoiceId {
  return VOICE_MAP[personaId] ?? DEFAULT_VOICE_ID;
}
