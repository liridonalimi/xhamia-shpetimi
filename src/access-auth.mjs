import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwksCache = new Map();

export class AccessAuthError extends Error {
  constructor(code) {
    super(code);
    this.name = 'AccessAuthError';
    this.code = code;
  }
}

function teamDomain(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch {
    throw new AccessAuthError('access_not_configured');
  }
}

function audiences(value) {
  const values = String(value ?? '').split(',').map(item => item.trim()).filter(Boolean);
  if (!values.length) throw new AccessAuthError('access_not_configured');
  return values;
}

function identityFromPayload(payload) {
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AccessAuthError('invalid_identity');
  return Object.freeze({
    email,
    subject: typeof payload.sub === 'string' ? payload.sub : null,
  });
}

async function cloudflareJwtPayload(token, { issuer, audience }) {
  const certsUrl = `${issuer}/cdn-cgi/access/certs`;
  let jwks = jwksCache.get(certsUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(certsUrl));
    jwksCache.set(certsUrl, jwks);
  }
  const { payload } = await jwtVerify(token, jwks, { issuer, audience });
  return payload;
}

export async function requireAccessIdentity(request, env = {}, ctx = {}, options = {}) {
  if (ctx?.access && typeof ctx.access.getIdentity === 'function') {
    try {
      return identityFromPayload(await ctx.access.getIdentity());
    } catch (error) {
      if (error instanceof AccessAuthError) throw error;
      throw new AccessAuthError('invalid_identity');
    }
  }

  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) throw new AccessAuthError('access_required');

  const issuer = teamDomain(env.ACCESS_TEAM_DOMAIN);
  const audience = audiences(env.ACCESS_POLICY_AUD);
  try {
    const payload = await (options.verifyJwt ?? cloudflareJwtPayload)(token, { issuer, audience });
    return identityFromPayload(payload);
  } catch (error) {
    if (error instanceof AccessAuthError) throw error;
    throw new AccessAuthError('invalid_token');
  }
}
