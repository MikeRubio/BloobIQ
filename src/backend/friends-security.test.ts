import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readdirSync(join(process.cwd(), 'supabase', 'migrations')).find((name) => name.endsWith('_play_with_friends.sql'));
if (!migration) throw new Error('Play with Friends migration is missing');
const sql = readFileSync(join(process.cwd(), 'supabase', 'migrations', migration), 'utf8').toLowerCase();

describe('Play with Friends database contract', () => {
  it.each(['friend_rooms', 'friend_room_members', 'friend_matches', 'friend_match_players', 'friend_match_rounds', 'friend_answers', 'friend_rate_events'])(
    'enables defense-in-depth RLS on private.%s',
    (table) => expect(sql).toContain(`alter table private.${table} enable row level security`),
  );

  it('keeps authoritative match state and answer keys out of direct client access', () => {
    expect(sql).toContain('revoke all on table private.friend_rooms');
    expect(sql).toContain('private.friend_match_rounds, private.friend_answers');
    expect(sql).toContain("case when v_phase->>'phase' = 'reveal' then jsonb_build_object('correctchoiceid'");
  });

  it('allows only room members to read minimal Realtime invalidation ticks', () => {
    expect(sql).toContain('alter table public.friend_room_events enable row level security');
    expect(sql).toContain('create policy friend_events_read_members');
    expect(sql).toContain('using ((select private.friend_is_member(room_id)))');
    expect(sql).toContain('alter publication supabase_realtime add table public.friend_room_events');
  });

  it('enforces roster size, readiness, question window, and one answer', () => {
    expect(sql).toContain('if v_count < 2');
    expect(sql).toContain('>= 8');
    expect(sql).toContain('and not is_ready');
    expect(sql).toContain("v_phase->>'phase' <> 'question'");
    expect(sql).toContain('primary key (match_id, user_id, question_index)');
  });

  it('uses server timestamps and fresh match identities for rematches', () => {
    expect(sql).toContain("clock_timestamp() + interval '3 seconds'");
    expect(sql).toContain("interval '130 seconds'");
    expect(sql).toContain("set status = 'lobby', current_match_id = null");
  });
});
