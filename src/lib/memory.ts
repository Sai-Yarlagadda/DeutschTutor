import db from '@/lib/db';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  name: string;
  level: string;
  interests: string[];
}

export interface LanguageMemory {
  repeatedMistakes: string[];
}

export interface ConversationSummary {
  persona: string;
  scenario: string;
  preview: string;
  createdAt: string;
}

export interface MemoryContext {
  profile: UserProfile | null;
  languageMemory: LanguageMemory;
  recentConversations: ConversationSummary[];
}

// ── DB row shapes ──────────────────────────────────────────────────────────────

interface UserProfileRow {
  id: number;
  name: string;
  level: string;
  interests: string | null;
  created_at: string;
}

interface LanguageMemoryRow {
  id: number;
  user_id: number;
  repeated_mistakes: string | null;
  updated_at: string;
}

interface ConversationHistoryRow {
  id: number;
  user_id: number;
  persona: string;
  scenario: string;
  messages: string;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

function rowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    interests: parseJsonArray(row.interests),
  };
}

// ── getOrCreateUser ────────────────────────────────────────────────────────────

export function getOrCreateUser(name: string, level?: string): UserProfile {
  const existing = db
    .prepare('SELECT * FROM user_profiles WHERE name LIKE ? LIMIT 1')
    .get(name) as UserProfileRow | undefined;

  if (existing) {
    return rowToUserProfile(existing);
  }

  const result = db
    .prepare(
      "INSERT INTO user_profiles (name, level, interests) VALUES (?, ?, '[]')"
    )
    .run(name, level ?? 'A2');

  const created = db
    .prepare('SELECT * FROM user_profiles WHERE id = ?')
    .get(result.lastInsertRowid) as UserProfileRow;

  return rowToUserProfile(created);
}

// ── getMemoryContext ───────────────────────────────────────────────────────────

export function getMemoryContext(userId: number): MemoryContext {
  const profileRow = db
    .prepare('SELECT * FROM user_profiles WHERE id = ?')
    .get(userId) as UserProfileRow | undefined;

  if (!profileRow) {
    return {
      profile: null,
      languageMemory: { repeatedMistakes: [] },
      recentConversations: [],
    };
  }

  const profile = rowToUserProfile(profileRow);

  const memoryRow = db
    .prepare('SELECT * FROM language_memory WHERE user_id = ? LIMIT 1')
    .get(userId) as LanguageMemoryRow | undefined;

  const languageMemory: LanguageMemory = {
    repeatedMistakes: parseJsonArray(memoryRow?.repeated_mistakes ?? null),
  };

  const convRows = db
    .prepare(
      'SELECT * FROM conversation_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
    )
    .all(userId) as ConversationHistoryRow[];

  const recentConversations: ConversationSummary[] = convRows.map((row) => ({
    persona: row.persona,
    scenario: row.scenario,
    preview: row.messages.slice(0, 80),
    createdAt: row.created_at,
  }));

  return { profile, languageMemory, recentConversations };
}

// ── buildMemoryPrompt ──────────────────────────────────────────────────────────

export function buildMemoryPrompt(ctx: MemoryContext): string {
  if (!ctx.profile) return '';

  const interests =
    ctx.profile.interests.length > 0
      ? ctx.profile.interests.join(', ')
      : 'not specified';

  const mistakes =
    ctx.languageMemory.repeatedMistakes.length > 0
      ? ctx.languageMemory.repeatedMistakes.join(', ')
      : 'none recorded yet';

  const personaNames = [
    ...new Set(ctx.recentConversations.map((c) => c.persona)),
  ];

  const conversationsLine =
    ctx.recentConversations.length > 0
      ? `${ctx.recentConversations.length} previous session(s) with ${personaNames.join(', ')}.`
      : '0 previous sessions.';

  return `--- User Memory ---
Name: ${ctx.profile.name}, German level: ${ctx.profile.level}.
Interests: ${interests}.
Past mistakes to gently watch for: ${mistakes}.
Recent conversations: ${conversationsLine}
---`;
}

// ── saveMistake ────────────────────────────────────────────────────────────────

export function saveMistake(
  userId: number,
  original: string,
  corrected: string,
  type: string
): void {
  const existing = db
    .prepare('SELECT * FROM language_memory WHERE user_id = ? LIMIT 1')
    .get(userId) as LanguageMemoryRow | undefined;

  const entry = `${type}: '${original}' → '${corrected}'`;

  if (existing) {
    const mistakes = parseJsonArray(existing.repeated_mistakes);
    mistakes.push(entry);
    // Cap at 20 — remove oldest from the front
    const capped = mistakes.length > 20 ? mistakes.slice(mistakes.length - 20) : mistakes;
    db.prepare(
      "UPDATE language_memory SET repeated_mistakes = ?, updated_at = datetime('now') WHERE user_id = ?"
    ).run(JSON.stringify(capped), userId);
  } else {
    db.prepare(
      "INSERT INTO language_memory (user_id, repeated_mistakes, updated_at) VALUES (?, ?, datetime('now'))"
    ).run(userId, JSON.stringify([entry]));
  }
}

// ── saveConversation ───────────────────────────────────────────────────────────

export function saveConversation(
  userId: number,
  persona: string,
  scenario: string,
  messages: { role: string; content: string }[]
): void {
  db.prepare(
    'INSERT INTO conversation_history (user_id, persona, scenario, messages) VALUES (?, ?, ?, ?)'
  ).run(userId, persona, scenario, JSON.stringify(messages));

  // Prune to keep only the last 10 conversations for this user
  const rows = db
    .prepare(
      'SELECT id FROM conversation_history WHERE user_id = ? ORDER BY created_at DESC'
    )
    .all(userId) as { id: number }[];

  if (rows.length > 10) {
    const idsToDelete = rows.slice(10).map((r) => r.id);
    const placeholders = idsToDelete.map(() => '?').join(', ');
    db.prepare(
      `DELETE FROM conversation_history WHERE id IN (${placeholders})`
    ).run(...idsToDelete);
  }
}
