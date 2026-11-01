import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

function required(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const authorization = request.headers.get('authorization');
  if (!authorization?.toLowerCase().startsWith('bearer ')) return json(401, { error: 'authentication_required' });

  try {
    const url = required('SUPABASE_URL');
    const publishableKey = required('SUPABASE_ANON_KEY');
    const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
    const userClient = createClient(url, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authorization.slice('bearer '.length).trim();
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json(401, { error: 'invalid_session' });

    const payload = await request.json().catch(() => null) as { confirm?: unknown } | null;
    if (payload?.confirm !== true) return json(400, { error: 'confirmation_required' });

    const { error: cleanupError } = await userClient.rpc('prepare_account_deletion');
    if (cleanupError) throw cleanupError;

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id, false);
    if (deleteError) throw deleteError;

    return json(200, { deleted: true });
  } catch (error) {
    console.error(JSON.stringify({
      event: 'account_deletion_failed',
      message: error instanceof Error ? error.message : String(error),
    }));
    return json(500, { error: 'account_deletion_failed' });
  }
});
