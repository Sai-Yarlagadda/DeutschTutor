import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/transcribe
 *
 * Accepts multipart/form-data with an `audio` field (Blob/File) and
 * forwards it to OpenAI Whisper for German transcription.
 *
 * Returns: { transcript: string }
 * Errors:  { error: string } with status 500
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Parse the incoming multipart form data.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Failed to parse multipart form data" },
      { status: 400 }
    );
  }

  const audioField = formData.get("audio");

  if (!audioField || !(audioField instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing or invalid `audio` field in form data" },
      { status: 400 }
    );
  }

  // Build the form data payload for the Whisper API.
  const whisperForm = new FormData();
  whisperForm.append("file", audioField, "audio.webm");
  whisperForm.append("model", "whisper-1");
  whisperForm.append("language", "de");

  // Call the OpenAI Whisper transcriptions endpoint.
  let whisperResponse: Response;
  try {
    whisperResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperForm,
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error reaching Whisper API";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!whisperResponse.ok) {
    let detail = `Whisper API responded with status ${whisperResponse.status}`;
    try {
      const body = (await whisperResponse.json()) as { error?: { message?: string } };
      if (body?.error?.message) {
        detail = body.error.message;
      }
    } catch {
      // Ignore JSON parse errors on error responses.
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }

  let result: { text?: string };
  try {
    result = (await whisperResponse.json()) as { text?: string };
  } catch {
    return NextResponse.json(
      { error: "Failed to parse Whisper API response" },
      { status: 500 }
    );
  }

  return NextResponse.json({ transcript: result.text ?? "" });
}
