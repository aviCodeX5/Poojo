export interface Env {
  CLOUDINARY_URL?: string;
  DB?: any;
  EMAIL_VERIFICATION_DEV_MODE?: string;
}

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

function errorJson(message: string, status = 400) {
  return json({ error: message }, { status });
}

function parseCloudinaryUrl(value?: string): CloudinaryConfig | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'cloudinary:') return null;

    return {
      cloudName: url.hostname,
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password),
    };
  } catch {
    return null;
  }
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function withoutExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
}

async function sha1Hex(value: string) {
  const input = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-1', input);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(value: string) {
  const input = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function randomNumericCode(length = 6) {
  const digits = new Uint8Array(length);
  crypto.getRandomValues(digits);
  return [...digits].map(byte => String(byte % 10)).join('');
}

function normalizeIndianPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return value.trim();
}

function committeeFromRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    committeeId: row.id,
    name: row.name,
    pujaType: row.puja_type,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    pandalAddress: row.pandal_address,
    pandalLatLng: { lat: row.pandal_lat, lng: row.pandal_lng },
    foundedYear: row.founded_year,
    adminEmail: row.admin_email,
    adminPhone: row.admin_phone,
    currentEditionId: row.current_edition_id,
    currentYear: row.current_year,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

function memberFromRow(row: any) {
  if (!row) return null;
  return {
    memberId: row.member_id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    address: row.address || '',
    loginCode: row.login_code || '',
    addedAt: row.added_at,
    addedBy: row.added_by,
    isActive: Boolean(row.is_active),
  };
}

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

async function readJson(request: Request) {
  try {
    return await request.json() as Record<string, any>;
  } catch {
    return {};
  }
}

function requireD1(env: Env) {
  if (!env.DB) throw new Error('D1 database is not configured');
  return env.DB;
}

async function createCloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return sha1Hex(`${payload}${apiSecret}`);
}

async function handleCloudinaryUpload(request: Request, env: Env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
  }

  const cloudinary = parseCloudinaryUrl(env.CLOUDINARY_URL);
  if (!cloudinary) {
    return new Response('Cloudinary storage is not configured', { status: 500, headers: corsHeaders() });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const committeeId = sanitizeSegment(formData.get('committeeId')?.toString() || '');
  const userId = sanitizeSegment(formData.get('userId')?.toString() || '');
  const rawFileName = formData.get('fileName')?.toString() || '';

  if (!(file instanceof File) || !committeeId || !userId || !rawFileName) {
    return new Response('Invalid upload data', { status: 400, headers: corsHeaders() });
  }

  const safeFileName = sanitizeSegment(rawFileName);
  const publicId = `${Date.now()}_${withoutExtension(safeFileName)}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = `samitibook/committees/${committeeId}/bills/${userId}`;
  const signatureParams = {
    folder,
    public_id: publicId,
    timestamp,
  };
  const signature = await createCloudinarySignature(signatureParams, cloudinary.apiSecret);

  const uploadData = new FormData();
  uploadData.append('file', file);
  uploadData.append('api_key', cloudinary.apiKey);
  uploadData.append('folder', folder);
  uploadData.append('public_id', publicId);
  uploadData.append('timestamp', timestamp);
  uploadData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/auto/upload`, {
    method: 'POST',
    body: uploadData,
  });

  const result: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    return new Response(result?.error?.message || 'Cloudinary upload failed', {
      status: response.status,
      headers: corsHeaders(),
    });
  }

  return new Response(JSON.stringify({
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
  }), {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  });
}

async function handleMemberLogin(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const db = requireD1(env);
  const body = await readJson(request);
  const phone = normalizeIndianPhone(String(body.phone || ''));
  const loginCode = String(body.code || body.loginCode || '').trim().toUpperCase();

  if (!phone || !loginCode) return errorJson('Mobile number and login code are required');

  const member = await db.prepare(`
    SELECT *
    FROM members
    WHERE phone = ? AND upper(login_code) = ? AND is_active = 1
    LIMIT 1
  `).bind(phone, loginCode).first();

  if (!member) return errorJson('Invalid mobile number or login code', 401);

  const committee = await db.prepare('SELECT * FROM committees WHERE id = ? AND is_active = 1')
    .bind(member.committee_id)
    .first();

  if (!committee) return errorJson('Committee is inactive or unavailable', 403);

  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.prepare(`
    INSERT INTO sessions (id, user_type, committee_id, member_id, email, created_at, expires_at)
    VALUES (?, 'MEMBER', ?, ?, NULL, ?, ?)
  `).bind(token, member.committee_id, member.member_id, now.toISOString(), expiresAt.toISOString()).run();

  return json({
    token,
    expiresAt: expiresAt.toISOString(),
    committee: committeeFromRow(committee),
    member: memberFromRow(member),
  });
}

async function getSessionContext(request: Request, env: Env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const db = requireD1(env);
  const session = await db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
    .bind(token, new Date().toISOString())
    .first();
  if (!session) return null;

  const committee = await db.prepare('SELECT * FROM committees WHERE id = ? AND is_active = 1')
    .bind(session.committee_id)
    .first();
  if (!committee) return null;

  const member = session.member_id
    ? await db.prepare('SELECT * FROM members WHERE committee_id = ? AND member_id = ?')
      .bind(session.committee_id, session.member_id)
      .first()
    : null;

  return {
    session,
    committee,
    member,
  };
}

async function handleSession(request: Request, env: Env) {
  if (request.method !== 'GET') return errorJson('Method Not Allowed', 405);
  const context = await getSessionContext(request, env);
  if (!context) return errorJson('Session not found', 401);

  return json({
    user: {
      uid: context.session.member_id || context.session.email,
      type: context.session.user_type,
      email: context.session.email,
      phoneNumber: context.session.member_id,
    },
    committee: committeeFromRow(context.committee),
    member: memberFromRow(context.member),
  });
}

async function handleLogout(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const token = getBearerToken(request);
  if (token && env.DB) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run();
  }
  return json({ ok: true });
}

async function handleEmailVerificationRequest(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const db = requireD1(env);
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return errorJson('Valid email is required');

  const code = randomNumericCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  const codeHash = await sha256Hex(code);

  await db.prepare(`
    INSERT INTO email_verification_codes (id, email, code_hash, created_at, expires_at, consumed_at)
    VALUES (?, ?, ?, ?, ?, NULL)
  `).bind(randomToken(16), email, codeHash, now.toISOString(), expiresAt.toISOString()).run();

  return json({
    ok: true,
    delivery: 'email_provider_not_configured',
    expiresAt: expiresAt.toISOString(),
    ...(env.EMAIL_VERIFICATION_DEV_MODE === 'true' ? { developmentCode: code } : {}),
  });
}

async function handleEmailVerificationConfirm(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const db = requireD1(env);
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();
  if (!email || !code) return errorJson('Email and code are required');

  const codeHash = await sha256Hex(code);
  const row = await db.prepare(`
    SELECT *
    FROM email_verification_codes
    WHERE email = ? AND code_hash = ? AND consumed_at IS NULL AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(email, codeHash, new Date().toISOString()).first();

  if (!row) return errorJson('Invalid or expired verification code', 401);

  await db.prepare('UPDATE email_verification_codes SET consumed_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), row.id)
    .run();

  return json({ ok: true, emailVerified: true });
}

async function handleD1Collection(request: Request, env: Env, url: URL) {
  if (request.method !== 'GET') return errorJson('Method Not Allowed', 405);
  const context = await getSessionContext(request, env);
  if (!context) return errorJson('Session not found', 401);

  const parts = url.pathname.split('/').filter(Boolean);
  const committeeId = parts[2];
  const collectionName = parts[3];
  if (committeeId !== context.session.committee_id) return errorJson('Forbidden', 403);

  if (!collectionName) {
    return json({
      committee: committeeFromRow(context.committee),
      member: memberFromRow(context.member),
    });
  }

  if (collectionName === 'members') {
    const result = await env.DB.prepare('SELECT * FROM members WHERE committee_id = ? ORDER BY role, name')
      .bind(committeeId)
      .all();
    return json({ records: (result.results || []).map(memberFromRow) });
  }

  const result = await env.DB.prepare(`
    SELECT record_id, data_json
    FROM collection_records
    WHERE committee_id = ? AND collection_name = ?
    ORDER BY updated_at DESC
  `).bind(committeeId, collectionName).all();

  return json({
    records: (result.results || []).map((row: any) => ({
      id: row.record_id,
      ...JSON.parse(row.data_json),
    })),
  });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname.startsWith('/api/cloudinary/upload')) {
      return handleCloudinaryUpload(request, env);
    }

    try {
      if (url.pathname === '/api/auth/member-login') return handleMemberLogin(request, env);
      if (url.pathname === '/api/auth/session') return handleSession(request, env);
      if (url.pathname === '/api/auth/logout') return handleLogout(request, env);
      if (url.pathname === '/api/auth/email-verification/request') return handleEmailVerificationRequest(request, env);
      if (url.pathname === '/api/auth/email-verification/confirm') return handleEmailVerificationConfirm(request, env);
      if (url.pathname.startsWith('/api/d1/committees/')) return handleD1Collection(request, env, url);
    } catch (error: any) {
      return errorJson(error?.message || 'Unexpected worker error', 500);
    }

    return new Response('Not found', { status: 404 });
  },
};
