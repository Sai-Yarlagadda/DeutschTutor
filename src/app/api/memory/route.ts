import { NextRequest, NextResponse } from 'next/server';
import { getMemoryContext, MemoryContext } from '@/lib/memory';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId');

  if (!userIdParam) {
    return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
  }

  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId) || userId <= 0) {
    return NextResponse.json({ error: 'userId must be a valid positive integer' }, { status: 400 });
  }

  const ctx: MemoryContext = getMemoryContext(userId);
  return NextResponse.json(ctx);
}
