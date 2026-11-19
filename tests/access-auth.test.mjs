import test from 'node:test';
import assert from 'node:assert/strict';
import { AccessAuthError, requireAccessIdentity } from '../src/access-auth.mjs';

test('Cloudflare Access identity can be read from a directly authenticated Worker context', async () => {
  const identity = await requireAccessIdentity(
    new Request('https://example.test/admin/api/session'),
    {},
    { access: { getIdentity: async () => ({ email: 'Admin@Example.test', sub: 'user-1' }) } },
  );
  assert.deepEqual(identity, { email: 'admin@example.test', subject: 'user-1' });
});

test('the signed Access header is verified against the configured issuer and audiences', async () => {
  let verification;
  const request = new Request('https://example.test/admin/api/session', {
    headers: { 'cf-access-jwt-assertion': 'signed-access-token' },
  });
  const identity = await requireAccessIdentity(request, {
    ACCESS_TEAM_DOMAIN: 'https://shpetimi.cloudflareaccess.com',
    ACCESS_POLICY_AUD: 'production-aud, preview-aud',
  }, {}, {
    verifyJwt: async (token, config) => {
      verification = { token, config };
      return { email: 'administrator@example.test', sub: 'access-user' };
    },
  });

  assert.deepEqual(verification, {
    token: 'signed-access-token',
    config: {
      issuer: 'https://shpetimi.cloudflareaccess.com',
      audience: ['production-aud', 'preview-aud'],
    },
  });
  assert.deepEqual(identity, { email: 'administrator@example.test', subject: 'access-user' });
});

test('missing, malformed or unconfigured Access identity fails closed', async () => {
  await assert.rejects(
    requireAccessIdentity(new Request('https://example.test/admin/')),
    error => error instanceof AccessAuthError && error.code === 'access_required',
  );
  await assert.rejects(
    requireAccessIdentity(new Request('https://example.test/admin/', {
      headers: { 'cf-access-jwt-assertion': 'token' },
    }), {}, {}, { verifyJwt: async () => ({ email: 'administrator@example.test' }) }),
    error => error instanceof AccessAuthError && error.code === 'access_not_configured',
  );
  await assert.rejects(
    requireAccessIdentity(new Request('https://example.test/admin/'), {}, {
      access: { getIdentity: async () => ({ email: 'not-an-email' }) },
    }),
    error => error instanceof AccessAuthError && error.code === 'invalid_identity',
  );
});
