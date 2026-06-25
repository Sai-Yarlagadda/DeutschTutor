import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  let text: string;
  let voiceId: string;

  try {
    const body = await request.json();
    text = body.text;
    voiceId = body.voiceId;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "text" field' }, { status: 400 });
  }

  if (!voiceId || typeof voiceId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "voiceId" field' }, { status: 400 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 });
  }

  const elevenLabsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!elevenLabsResponse.ok) {
    return NextResponse.json({ error: 'TTS service error' }, { status: 502 });
  }

  return new Response(elevenLabsResponse.body, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
