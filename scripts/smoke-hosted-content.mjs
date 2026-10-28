import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const envText = await readFile(new URL('../.env', import.meta.url), 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  const separator = line.indexOf('=');
  return [line.slice(0, separator), line.slice(separator + 1).trim()];
}));
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Supabase public environment values are missing');

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: auth, error: authError } = await client.auth.signInAnonymously();
if (authError || !auth.user) throw authError ?? new Error('Anonymous sign-in did not return a user');
const userId = auth.user.id;

const { error: profileError } = await client.rpc('sync_guest_profile', {
  p_display_name: 'Content Smoke Test', p_avatar: '🧪', p_avatar_color: '#2D9CDB',
});
if (profileError) throw profileError;

const expectedPacks = {
  football: { version: 'football-v1', count: 17 },
  baseball: { version: 'baseball-mlb-v1', count: 30 },
  basketball: { version: 'basketball-nba-v1', count: 30 },
};
const casualSummaries = [];
for (const [categoryId, expected] of Object.entries(expectedPacks)) {
  const { data: casualPack, error: casualError } = await client.rpc('get_casual_quiz_pack', { p_category_id: categoryId });
  if (casualError) throw casualError;
  if (casualPack?.categoryId !== categoryId || casualPack?.contentVersion !== expected.version || casualPack?.items?.length !== expected.count || new Set(casualPack.items.map((item) => item.id)).size !== expected.count) {
    throw new Error(`Invalid ${categoryId} Casual pack response`);
  }
  if (categoryId === 'football' && (casualPack.items.filter((item) => item.contentType === 'confederation').length !== 6 || casualPack.items.filter((item) => item.contentType === 'league').length !== 11)) {
    throw new Error('Invalid Football content scopes');
  }
  if (categoryId !== 'football' && casualPack.items.some((item) => item.distractorIds?.length !== 4)) throw new Error(`Invalid ${categoryId} distractors`);
  const casualAssets = await Promise.all(casualPack.items.map((item) => fetch(`${url}/storage/v1/object/public/quiz-assets/${item.assetPath}`, { method: 'HEAD' })));
  if (casualAssets.some((response) => !response.ok || !response.headers.get('content-type')?.startsWith('image/'))) {
    throw new Error(`At least one ${categoryId} Casual asset is unavailable or has the wrong content type`);
  }
  casualSummaries.push({ categoryId, contentVersion: casualPack.contentVersion, items: casualPack.items.length, assetsOk: casualAssets.length });
}

const summaries = [];
for (const categoryId of ['flags', 'football', 'baseball', 'basketball']) {
  const { data, error } = await client.rpc('start_daily_attempt', { p_category_id: categoryId });
  if (error) throw error;
  const round = data?.currentRound;
  if (data?.categoryId !== categoryId || data?.state !== 'in_progress' || !round?.assetPath || round.options?.length !== 4 || round.correctChoiceId) {
    throw new Error(`Invalid ${categoryId} daily response`);
  }
  const assetResponse = await fetch(`${url}/storage/v1/object/public/quiz-assets/${round.assetPath}`, { method: 'HEAD' });
  if (!assetResponse.ok) throw new Error(`${categoryId} asset returned ${assetResponse.status}`);
  summaries.push({ categoryId, contentVersion: data.contentVersion, assetPath: round.assetPath, choices: round.options.length, assetStatus: assetResponse.status });
  if (categoryId === 'basketball') {
    const { data: answer, error: answerError } = await client.rpc('submit_daily_answer', {
      p_attempt_id: data.attemptId, p_question_index: data.questionIndex, p_choice_id: null, p_request_id: randomUUID(),
    });
    if (answerError) throw answerError;
    if (!answer?.lastAnswer?.correctChoiceId || !answer?.lastAnswer?.correctLabel) throw new Error('Post-answer feedback is missing the protected answer reveal');
  }
}

console.log(JSON.stringify({ userId, casual: casualSummaries, summaries }));
