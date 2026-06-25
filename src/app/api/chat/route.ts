import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getMemoryContext, buildMemoryPrompt } from '@/lib/memory';

interface Persona {
  name: string;
  age: number;
  city: string;
  occupation: string;
  scenario: string;
  personality: string;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  persona: Persona;
  userMessage: string;
  history: HistoryMessage[];
  userLevel: string;
  memoryContext?: string;
  userId?: number;
}

function buildSystemPrompt(persona: Persona, userLevel: string, memoryContext?: string): string {
  const memorySection = memoryContext ? `\n${memoryContext}` : '';

  return `You are ${persona.name}, ${persona.age} years old, from ${persona.city}.
You work as ${persona.occupation}.
You are currently in ${persona.scenario}.

${persona.personality}

RULES:
- Speak naturally as this character. Remain in character at all times.
- Use realistic, conversational German — not textbook German.
- NEVER switch to English, even if the user writes in English.
- Adapt your vocabulary and sentence complexity to the learner's level: ${userLevel}.
- When the user makes a grammar or vocabulary mistake, naturally echo the correct form in your reply without explicitly saying "that is wrong". For example: if they say "Ich habe gegangen", you might reply "Ah, du bist also gegangen! Wohin denn?"
- Only correct one mistake per turn.
- Keep responses concise — 1 to 3 sentences unless the conversation naturally calls for more.
- If you detect a mistake the user made, include at the very end of your response (after a newline) a JSON block in this exact format: {"correction":{"original":"...","corrected":"...","type":"grammar|vocabulary|case"}}
- If there is no mistake, do not include any JSON block.
${memorySection}`;
}

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
    // Validate required fields
    if (
      !body.persona ||
      typeof body.persona.name !== 'string' ||
      typeof body.persona.age !== 'number' ||
      typeof body.persona.city !== 'string' ||
      typeof body.persona.occupation !== 'string' ||
      typeof body.persona.scenario !== 'string' ||
      typeof body.persona.personality !== 'string' ||
      typeof body.userMessage !== 'string' ||
      !Array.isArray(body.history) ||
      typeof body.userLevel !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { persona, userMessage, history, userLevel } = body;

  // Resolve memory context: prefer server-fetched (via userId) over client-supplied
  let resolvedMemoryContext: string | undefined = body.memoryContext;
  if (typeof body.userId === 'number' && body.userId > 0) {
    const ctx = getMemoryContext(body.userId);
    resolvedMemoryContext = buildMemoryPrompt(ctx) || undefined;
  }

  try {
    const client = new Anthropic({ apiKey });

    const systemPrompt = buildSystemPrompt(persona, userLevel, resolvedMemoryContext);

    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = event.delta.text;
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
