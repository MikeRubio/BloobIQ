import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const migrationName = readdirSync(migrationsDirectory).find((name) => name.endsWith('_bloopiq_backend_foundation.sql'));
if (!migrationName) throw new Error('BloopIQ backend migration is missing');
const sql = readFileSync(join(migrationsDirectory, migrationName), 'utf8').toLowerCase();
const allSql = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => readFileSync(join(migrationsDirectory, name), 'utf8'))
  .join('\n')
  .toLowerCase();
const casualMigrationName = readdirSync(migrationsDirectory).find((name) => name.endsWith('_add_casual_quiz_pack_rpc.sql'));
if (!casualMigrationName) throw new Error('Casual quiz pack migration is missing');
const casualSql = readFileSync(join(migrationsDirectory, casualMigrationName), 'utf8').toLowerCase();

describe('BloopIQ migration security contract', () => {
  it.each(['guest_profiles', 'daily_challenges', 'daily_attempts', 'daily_answers'])(
    'enables RLS on %s',
    (table) => expect(sql).toContain(`alter table public.${table} enable row level security`),
  );

  it('keeps attempts and answers read-only to the app role', () => {
    expect(sql).toContain('revoke all on public.categories, public.guest_profiles, public.daily_challenges, public.daily_attempts, public.daily_answers from anon, authenticated');
    expect(sql).toContain('grant select on public.daily_attempts to authenticated');
    expect(sql).not.toMatch(/grant\s+(insert|update|delete)[^;]*daily_attempts/);
    expect(sql).not.toMatch(/grant\s+(select|insert|update|delete)[^;]*daily_answers/);
  });

  it('authorizes score mutations through authenticated RPCs only', () => {
    expect(sql).toContain('create or replace function public.submit_daily_answer');
    expect(sql).toContain("declare\n  v_user uuid := private.require_user()");
    expect(sql).toContain("security definer set search_path = ''");
    expect(sql).toContain('revoke all on function public.submit_daily_answer(uuid, smallint, uuid, uuid) from public, anon');
    expect(sql).toContain('grant execute on function public.submit_daily_answer(uuid, smallint, uuid, uuid) to authenticated');
  });

  it('pins one attempt per user and makes submissions idempotent', () => {
    expect(sql).toContain('unique (challenge_id, user_id)');
    expect(sql).toContain('unique (attempt_id, question_index)');
    expect(sql).toContain('unique (attempt_id, request_id)');
    expect(sql).toContain('where id = p_attempt_id and user_id = v_user for update');
  });

  it('serializes concurrent challenge creation', () => {
    expect(allSql).toContain('pg_advisory_xact_lock');
    expect(sql).toContain('unique (category_id, challenge_date)');
    expect(sql).toContain('on conflict (category_id, challenge_date) do nothing');
  });

  it.each(['flag_content', 'daily_challenge_rounds', 'quiz_content'])(
    'enables RLS on private.%s',
    (table) => expect(allSql).toContain(`alter table private.${table} enable row level security`),
  );

  it('keeps the hosted content catalog private and versioned', () => {
    expect(allSql).toContain('revoke all on table private.quiz_content from public, anon, authenticated');
    expect(allSql).toContain("'flags-195-v1'");
    expect(allSql).toContain("'football-v1'");
    expect(allSql).toContain("'football-symbols-v2'");
    expect(allSql).toContain("'baseball-mlb-v1'");
    expect(allSql).toContain("'basketball-nba-v1'");
    expect(allSql).toContain("values ('quiz-assets', 'quiz-assets', true");
    expect(allSql).toContain("'image/svg+xml'");
    expect(allSql).toContain("rights_status = 'trademark_reviewed_approved'");
    expect(allSql).toContain("where category_id = 'flags' and content_version = 'flags-v1'");
  });

  it('exposes only a scoped authenticated Casual pack RPC', () => {
    expect(allSql).toContain('create or replace function public.get_casual_quiz_pack');
    expect(allSql).toContain("v_user uuid := private.require_user()");
    expect(allSql).toContain('revoke all on function public.get_casual_quiz_pack(text) from public, anon');
    expect(allSql).toContain('grant execute on function public.get_casual_quiz_pack(text) to authenticated');
    expect(casualSql).not.toContain('correct_choice_id');
  });

  it('keeps complete Football artwork private until feedback', () => {
    expect(allSql).toContain('"questionassetrole":"symbol_only_quiz_variant"');
    expect(allSql).toContain('"revealassetrole":"complete_original_identity"');
    expect(allSql).toContain("'revealassetpath', v_round.reveal_asset_path");
    expect(allSql).toContain("else '{}'::jsonb end");
  });
});
