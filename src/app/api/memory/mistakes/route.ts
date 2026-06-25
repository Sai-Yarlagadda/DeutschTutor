import { NextRequest, NextResponse } from 'next/server';
import { saveMistake } from '@/lib/memory';

interface MistakeRequestBody {
  userId: number;
  original: string;
  corrected: string;
  type: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: MistakeRequestBody;
  try {
    body = (await request.json()) as MistakeRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (
    typeof body.userId !== 'number' ||
    typeof body.original !== 'string' ||
    typeof body.corrected !== 'string' ||
    typeof body.type !== 'string' ||
    !body.original ||
    !body.corrected ||
    !body.type
  ) {
    return NextResponse.json(
      { error: 'userId, original, corrected, and type are all required' },
      { status: 400 }
    );
  }

  saveMistake(body.userId, body.original, body.corrected, body.type);
  return NextResponse.json({ ok: true });
}
