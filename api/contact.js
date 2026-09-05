import { processContact } from '../server/contact-service.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const buckets = new Map();

function json(response, status, body, extraHeaders = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  for (const [name, value] of Object.entries(extraHeaders)) response.setHeader(name, value);
  response.end(JSON.stringify(body));
}

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;

  const configured = (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const allowed = new Set(configured);
  if (host) allowed.add(`${protocol}://${host}`);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    allowed.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return allowed.has(origin);
}

function consumeRateLimit(request) {
  const forwarded = request.headers['x-forwarded-for'];
  const clientIp = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  const now = Date.now();
  let bucket = buckets.get(clientIp);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(clientIp, bucket);
  }
  bucket.count += 1;

  // Prevent unbounded growth in a long-lived warm function instance.
  if (buckets.size > 5000) {
    for (const [ip, value] of buckets) if (value.resetAt <= now) buckets.delete(ip);
  }

  return {
    allowed: bucket.count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - bucket.count),
    resetSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Método no permitido.' }, { Allow: 'POST' });
  }
  if (!isAllowedOrigin(request)) {
    return json(response, 403, { error: 'Origen no permitido.' });
  }
  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return json(response, 415, { error: 'El contenido debe ser JSON.' });
  }

  const declaredSize = Number(request.headers['content-length'] || 0);
  if (declaredSize > 16 * 1024) {
    return json(response, 413, { error: 'La consulta es demasiado grande.' });
  }

  const rate = consumeRateLimit(request);
  const rateHeaders = {
    'RateLimit-Limit': String(MAX_REQUESTS),
    'RateLimit-Remaining': String(rate.remaining),
    'RateLimit-Reset': String(rate.resetSeconds),
  };
  if (!rate.allowed) {
    return json(
      response,
      429,
      { error: 'Demasiadas consultas. Inténtalo nuevamente en 15 minutos.' },
      { ...rateHeaders, 'Retry-After': String(rate.resetSeconds) },
    );
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    if (Buffer.byteLength(JSON.stringify(body ?? {}), 'utf8') > 16 * 1024) {
      return json(response, 413, { error: 'La consulta es demasiado grande.' }, rateHeaders);
    }
    const result = await processContact(body);
    return json(response, result.status, result.body, rateHeaders);
  } catch {
    return json(response, 400, { error: 'JSON inválido.' }, rateHeaders);
  }
}
