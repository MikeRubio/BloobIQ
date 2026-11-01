import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
const allowedOrigin = 'https://bloopiq-privacy.merry-coin-3817.chatgpt.site';
const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': allowedOrigin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type, authorization, apikey, x-client-info', 'vary': 'Origin', 'referrer-policy': 'no-referrer' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== allowedOrigin) return json(403, { error: 'origin_not_allowed' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  if (Number(request.headers.get('content-length') ?? 0) > 1024) return json(413, { error: 'request_too_large' });
  try {
    const raw = await request.text();
    if (raw.length > 1024) return json(413, { error: 'request_too_large' });
    const body = JSON.parse(raw);
    if (!body || typeof body.code !== 'string' || !/^[a-f0-9]{64}$/.test(body.code)) return json(400, { error: 'invalid_code' });
    if (!['status', 'review', 'withdraw', 'delete', 'sharing'].includes(body.action)) return json(400, { error: 'invalid_action' });
    if (body.action === 'sharing' && typeof body.sharing !== 'boolean') return json(400, { error: 'sharing_choice_required' });
    if (['delete', 'withdraw'].includes(body.action) && body.confirm !== true) return json(400, { error: 'confirmation_required' });
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = body.action === 'status'
      ? await admin.rpc('parent_consent_status', { p_request_secret: body.code })
      : await admin.rpc('parent_consent_control', { p_parent_secret: body.code, p_action: body.action, p_sharing: body.sharing ?? null });
    if (error) return json(403, { error: 'Permission could not be verified. Check your private link or contact the publisher.' });
    if (data?.deleteUserId) {
      const result = await admin.auth.admin.deleteUser(data.deleteUserId, false);
      if (result.error) return json(503, { error: 'Online access is blocked. Account deletion needs a retry; please press Delete again or contact the publisher.' });
    }
    if (data && typeof data === 'object') delete data.deleteUserId;
    return json(200, data);
  } catch {
    // Never log capability codes, request bodies, parent details, or exported data.
    return json(400, { error: 'invalid_request' });
  }
});
