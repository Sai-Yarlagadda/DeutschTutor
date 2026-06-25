import { NextRequest, NextResponse } from 'next/server';
import { saveConversation } from '@/lib/memory';

interface ConversationMessage {
  role: string;
  content: string;
}

interface ConversationRequestBody {
  userId: number;
  persona: string;
  scenario: string;
  messages: ConversationMessage[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: ConversationRequestBody;
  try {
    body = (await request.json()) as ConversationRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (
    typeof body.userId !== 'number' ||
    typeof body.persona !== 'string' ||
    typeof body.scenario !== 'string' ||
    !Array.isArray(body.messages) ||
    !body.persona ||
    !body.scenario
  ) {
    return NextResponse.json(
      { error: 'userId, persona, scenario, and messages are all required' },
      { status: 400 }
    );
  }

  saveConversation(body.userId, body.persona, body.scenario, body.messages);
  return NextResponse.json({ ok: true });
}
