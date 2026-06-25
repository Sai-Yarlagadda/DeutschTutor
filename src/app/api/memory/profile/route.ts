import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, UserProfile } from '@/lib/memory';

interface ProfileRequestBody {
  name: string;
  level?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: ProfileRequestBody;
  try {
    body = (await request.json()) as ProfileRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const user: UserProfile = getOrCreateUser(body.name, body.level);
  return NextResponse.json({ user });
}
