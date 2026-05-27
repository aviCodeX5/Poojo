export interface Env {
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
  CLOUDINARY_URL?: string;
  DB?: any;
  EMAIL_VERIFICATION_DEV_MODE?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
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

async function hmacSha256Hex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function pbkdf2Hash(password: string, salt = randomToken(16), iterations = 100000) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations },
    key,
    256,
  );
  const hash = [...new Uint8Array(bits)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationsText || !salt || !expectedHash) return false;
  const computed = await pbkdf2Hash(password, salt, Number(iterationsText));
  return computed === storedHash;
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

function makeId(prefix = 'rec') {
  return `${prefix}-${Date.now()}-${randomToken(6)}`;
}

function normalizeRecordId(value: string) {
  return value.replace(/[^a-zA-Z0-9_.+\-]/g, '_').slice(0, 128);
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  const folder = `pooja-samiti/committees/${committeeId}/bills/${userId}`;
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

async function createSession(db: any, userType: 'ADMIN' | 'MEMBER', committeeId: string, memberId?: string | null, email?: string | null) {
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await db.prepare(`
    INSERT INTO sessions (id, user_type, committee_id, member_id, email, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(token, userType, committeeId, memberId || null, email || null, now.toISOString(), expiresAt.toISOString()).run();
  return { token, expiresAt: expiresAt.toISOString() };
}

async function sendVerificationEmail(env: Env, email: string, code: string, expiresAt: string) {
  if (env.EMAIL_VERIFICATION_DEV_MODE === 'true') {
    return { delivery: 'development', developmentCode: code };
  }

  if (!env.RESEND_API_KEY) throw new Error('Resend email provider is not configured');
  const from = env.RESEND_FROM_EMAIL || 'Pooja Samiti <no-reply@poojasamiti.online>';
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Your Pooja Samiti verification code',
      text: `Your Pooja Samiti verification code is ${code}. This code expires in 5 minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">Pooja Samiti verification</h2>
          <p>Your verification code is:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #2563eb;">${escapeHtml(code)}</p>
          <p>This code expires in 5 minutes.</p>
          <p style="color: #64748b; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });
  const resendResult: any = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    throw new Error(resendResult?.message || resendResult?.error?.message || 'Resend email delivery failed');
  }
  return { delivery: 'sent', emailId: resendResult?.id, expiresAt };
}

function committeeIdFromRegistration(data: any) {
  const year = new Date().getFullYear();
  const type = String(data.pujaType || 'PUJA').slice(0, 3).toUpperCase();
  const city = String(data.city || 'CITY').slice(0, 3).toUpperCase();
  return normalizeRecordId(`${type}-${year}-${city}-${Math.floor(1000 + Math.random() * 9000)}`);
}

async function handleAdminRegisterStart(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const db = requireD1(env);
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !email.includes('@') || password.length < 6) return errorJson('Valid email and password are required');

  const existingAdmin = await db.prepare('SELECT email FROM admin_users WHERE email = ?').bind(email).first();
  if (existingAdmin) return errorJson('An admin account already exists for this email', 409);

  const duplicateCommittee = await db.prepare(`
    SELECT id FROM committees
    WHERE lower(name) = lower(?) AND lower(city) = lower(?) AND pincode = ?
    LIMIT 1
  `).bind(body.name || '', body.city || '', body.pincode || '').first();
  if (duplicateCommittee) return errorJson('A committee with this name and location already exists', 409);

  const code = randomNumericCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  await db.prepare(`
    INSERT INTO pending_admin_registrations (id, email, password_hash, registration_json, code_hash, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      registration_json = excluded.registration_json,
      code_hash = excluded.code_hash,
      created_at = excluded.created_at,
      expires_at = excluded.expires_at
  `).bind(
    makeId('pending-admin'),
    email,
    await pbkdf2Hash(password),
    JSON.stringify(body),
    await sha256Hex(code),
    now.toISOString(),
    expiresAt.toISOString(),
  ).run();

  let delivery: Awaited<ReturnType<typeof sendVerificationEmail>>;
  try {
    delivery = await sendVerificationEmail(env, email, code, expiresAt.toISOString());
  } catch (error: any) {
    await db.prepare('DELETE FROM pending_admin_registrations WHERE email = ?').bind(email).run();
    const message = String(error?.message || 'Email verification delivery failed');
    return errorJson(
      `Email verification could not be sent: ${message}. If you are using Resend test mode, send to the verified Resend account email or verify a sending domain in Resend.`,
      502,
    );
  }
  return json({ ok: true, email, expiresAt: expiresAt.toISOString(), ...delivery });
}

async function handleAdminRegisterConfirm(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const db = requireD1(env);
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();
  const pending = await db.prepare(`
    SELECT * FROM pending_admin_registrations
    WHERE email = ? AND code_hash = ? AND expires_at > ?
    LIMIT 1
  `).bind(email, await sha256Hex(code), new Date().toISOString()).first();
  if (!pending) return errorJson('Invalid or expired verification code', 401);

  const data = JSON.parse(pending.registration_json);
  const now = new Date().toISOString();
  let committeeId = committeeIdFromRegistration(data);
  for (let i = 0; i < 5; i++) {
    const exists = await db.prepare('SELECT id FROM committees WHERE id = ?').bind(committeeId).first();
    if (!exists) break;
    committeeId = committeeIdFromRegistration(data);
  }

  const phone = normalizeIndianPhone(String(data.adminPhone || ''));
  await db.batch([
    db.prepare(`
      INSERT INTO committees (
        id, name, puja_type, city, state, pincode, pandal_address, pandal_lat, pandal_lng,
        founded_year, admin_email, admin_phone, current_edition_id, current_year, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 1, ?)
    `).bind(
      committeeId,
      data.name,
      data.pujaType,
      data.city,
      data.state,
      data.pincode,
      data.pandalAddress || data.selectedLocation?.address || '',
      Number(data.pandalLatLng?.lat ?? data.selectedLocation?.lat ?? 0),
      Number(data.pandalLatLng?.lng ?? data.selectedLocation?.lng ?? 0),
      new Date().getFullYear(),
      email,
      phone,
      new Date().getFullYear(),
      now,
    ),
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, committee_id, created_at, verified_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(makeId('admin'), email, pending.password_hash, committeeId, now, now),
    db.prepare(`
      INSERT INTO members (committee_id, member_id, name, phone, role, address, login_code, added_at, added_by, is_active)
      VALUES (?, ?, 'Administrator', ?, 'ADMIN', 'Primary admin', ?, ?, ?, 1)
    `).bind(committeeId, phone, phone, 'ADMIN01', now, email),
    db.prepare('DELETE FROM pending_admin_registrations WHERE email = ?').bind(email),
  ]);

  const committee = await db.prepare('SELECT * FROM committees WHERE id = ?').bind(committeeId).first();
  const session = await createSession(db, 'ADMIN', committeeId, null, email);
  return json({ ...session, committee: committeeFromRow(committee), user: { uid: email, email, type: 'ADMIN' } });
}

async function handleAdminLogin(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const db = requireD1(env);
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const admin = await db.prepare('SELECT * FROM admin_users WHERE email = ?').bind(email).first();
  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return errorJson('Invalid email or password', 401);
  }
  const committee = await db.prepare('SELECT * FROM committees WHERE id = ? AND is_active = 1').bind(admin.committee_id).first();
  if (!committee) return errorJson('Committee is inactive or unavailable', 403);
  const session = await createSession(db, 'ADMIN', admin.committee_id, null, email);
  return json({ ...session, committee: committeeFromRow(committee), user: { uid: email, email, type: 'ADMIN' } });
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

  const delivery = await sendVerificationEmail(env, email, code, expiresAt.toISOString());
  return json({
    ok: true,
    expiresAt: expiresAt.toISOString(),
    ...delivery,
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

async function handleUpgradeOrder(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const context = await getSessionContext(request, env);
  if (!context) return errorJson('Session not found', 401);
  if (context.session.user_type !== 'ADMIN') return errorJson('Only admins can upgrade a committee', 403);
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return errorJson('Razorpay is not configured', 500);

  const body = await readJson(request);
  const committeeId = String(body.committeeId || '');
  if (committeeId !== context.session.committee_id) return errorJson('Forbidden', 403);

  const amount = 49900;
  const currency = 'INR';
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: `upgrade_${committeeId}_${Date.now()}`.slice(0, 40),
      notes: {
        committeeId,
        product: 'Pooja Samiti Upgrade',
      },
    }),
  });

  const result: any = await response.json().catch(() => ({}));
  if (!response.ok) return errorJson(result?.error?.description || 'Unable to create Razorpay order', response.status);

  return json({
    keyId: env.RAZORPAY_KEY_ID,
    orderId: result.id,
    amount,
    currency,
    name: 'Pooja Samiti',
    description: 'Committee upgrade',
  });
}

async function handleUpgradeVerify(request: Request, env: Env) {
  if (request.method !== 'POST') return errorJson('Method Not Allowed', 405);
  const context = await getSessionContext(request, env);
  if (!context) return errorJson('Session not found', 401);
  if (context.session.user_type !== 'ADMIN') return errorJson('Only admins can verify upgrades', 403);
  if (!env.RAZORPAY_KEY_SECRET) return errorJson('Razorpay is not configured', 500);

  const body = await readJson(request);
  const committeeId = String(body.committeeId || '');
  if (committeeId !== context.session.committee_id) return errorJson('Forbidden', 403);

  const orderId = String(body.razorpay_order_id || '');
  const paymentId = String(body.razorpay_payment_id || '');
  const signature = String(body.razorpay_signature || '');
  const expected = await hmacSha256Hex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
  if (!orderId || !paymentId || signature !== expected) return errorJson('Payment verification failed', 400);

  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO collection_records (committee_id, collection_name, record_id, data_json, created_at, updated_at)
    VALUES (?, 'subscriptions', 'current', ?, ?, ?)
    ON CONFLICT(committee_id, collection_name, record_id) DO UPDATE SET
      data_json = excluded.data_json,
      updated_at = excluded.updated_at
  `).bind(
    committeeId,
    JSON.stringify({ id: 'current', plan: 'UPGRADED', upgraded: true, razorpayOrderId: orderId, razorpayPaymentId: paymentId, upgradedAt: now }),
    now,
    now,
  ).run();

  return json({ ok: true, upgraded: true });
}

async function handleD1Collection(request: Request, env: Env, url: URL) {
  const context = await getSessionContext(request, env);
  if (!context) return errorJson('Session not found', 401);

  const parts = url.pathname.split('/').filter(Boolean);
  const committeeId = parts[3];
  const collectionName = parts[4];
  const recordId = parts[5];
  if (committeeId !== context.session.committee_id) return errorJson('Forbidden', 403);

  if (!collectionName && request.method === 'GET') {
    return json({
      committee: committeeFromRow(context.committee),
      member: memberFromRow(context.member),
    });
  }

  if (!collectionName) return errorJson('Collection name is required');

  if (request.method !== 'GET' && context.session.user_type !== 'ADMIN') {
    return errorJson('Members have view-only access', 403);
  }

  if (request.method === 'GET' && collectionName === 'members') {
    const result = await env.DB.prepare('SELECT * FROM members WHERE committee_id = ? ORDER BY role, name')
      .bind(committeeId)
      .all();
    return json({ records: (result.results || []).map(memberFromRow) });
  }

  if (request.method === 'GET') {
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

  if (collectionName === 'members') {
    const body = await readJson(request);
    if (request.method === 'POST') {
      const id = normalizeRecordId(body.memberId || body.phone || makeId('member'));
      await env.DB.prepare(`
        INSERT INTO members (committee_id, member_id, name, phone, role, address, login_code, added_at, added_by, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(committeeId, id, body.name, body.phone || id, body.role || 'MEMBER', body.address || '', body.loginCode || '', body.addedAt || new Date().toISOString(), body.addedBy || context.session.email || context.session.member_id).run();
      return json({ id, record: { ...body, memberId: id } }, { status: 201 });
    }
    if (!recordId) return errorJson('Member id is required');
    if (request.method === 'PATCH' || request.method === 'PUT') {
      const updates = await readJson(request);
      const current = await env.DB.prepare('SELECT * FROM members WHERE committee_id = ? AND member_id = ?').bind(committeeId, recordId).first();
      if (!current) return errorJson('Member not found', 404);
      const next = { ...memberFromRow(current), ...updates };
      await env.DB.prepare(`
        UPDATE members SET name = ?, phone = ?, role = ?, address = ?, login_code = ?, is_active = ?
        WHERE committee_id = ? AND member_id = ?
      `).bind(next.name, next.phone, next.role, next.address || '', next.loginCode || '', next.isActive === false ? 0 : 1, committeeId, recordId).run();
      return json({ id: recordId, record: next });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM members WHERE committee_id = ? AND member_id = ?').bind(committeeId, recordId).run();
      return json({ ok: true });
    }
  }

  if (collectionName === 'committee' && (request.method === 'PATCH' || request.method === 'PUT')) {
    const body = await readJson(request);
    await env.DB.prepare(`
      UPDATE committees SET name = ?, puja_type = ?, city = ?, state = ?, pincode = ?, pandal_address = ?, pandal_lat = ?, pandal_lng = ?, current_edition_id = ?, current_year = ?
      WHERE id = ?
    `).bind(
      body.name ?? context.committee.name,
      body.pujaType ?? context.committee.puja_type,
      body.city ?? context.committee.city,
      body.state ?? context.committee.state,
      body.pincode ?? context.committee.pincode,
      body.pandalAddress ?? context.committee.pandal_address,
      Number(body.pandalLatLng?.lat ?? context.committee.pandal_lat),
      Number(body.pandalLatLng?.lng ?? context.committee.pandal_lng),
      body.currentEditionId ?? context.committee.current_edition_id,
      body.currentYear ?? context.committee.current_year,
      committeeId,
    ).run();
    const committee = await env.DB.prepare('SELECT * FROM committees WHERE id = ?').bind(committeeId).first();
    return json({ record: committeeFromRow(committee) });
  }

  if (request.method === 'POST') {
    const body = await readJson(request);
    const id = normalizeRecordId(body.id || makeId(collectionName));
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO collection_records (committee_id, collection_name, record_id, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(committeeId, collectionName, id, JSON.stringify({ ...body, id }), now, now).run();
    return json({ id, record: { ...body, id } }, { status: 201 });
  }

  if (!recordId) return errorJson('Record id is required');
  if (request.method === 'PATCH' || request.method === 'PUT') {
    const body = await readJson(request);
    const existing = await env.DB.prepare(`
      SELECT data_json FROM collection_records
      WHERE committee_id = ? AND collection_name = ? AND record_id = ?
    `).bind(committeeId, collectionName, recordId).first();
    const current = existing ? JSON.parse(existing.data_json) : { id: recordId };
    const next = { ...current, ...body, id: recordId };
    await env.DB.prepare(`
      INSERT INTO collection_records (committee_id, collection_name, record_id, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(committee_id, collection_name, record_id) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `).bind(committeeId, collectionName, recordId, JSON.stringify(next), new Date().toISOString(), new Date().toISOString()).run();
    return json({ id: recordId, record: next });
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare(`
      DELETE FROM collection_records
      WHERE committee_id = ? AND collection_name = ? AND record_id = ?
    `).bind(committeeId, collectionName, recordId).run();
    return json({ ok: true });
  }

  return errorJson('Method Not Allowed', 405);
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
      if (url.pathname === '/api/auth/admin-register/start') return handleAdminRegisterStart(request, env);
      if (url.pathname === '/api/auth/admin-register/confirm') return handleAdminRegisterConfirm(request, env);
      if (url.pathname === '/api/auth/admin-login') return handleAdminLogin(request, env);
      if (url.pathname === '/api/auth/session') return handleSession(request, env);
      if (url.pathname === '/api/auth/logout') return handleLogout(request, env);
      if (url.pathname === '/api/auth/email-verification/request') return handleEmailVerificationRequest(request, env);
      if (url.pathname === '/api/auth/email-verification/confirm') return handleEmailVerificationConfirm(request, env);
      if (url.pathname === '/api/billing/upgrade/order') return handleUpgradeOrder(request, env);
      if (url.pathname === '/api/billing/upgrade/verify') return handleUpgradeVerify(request, env);
      if (url.pathname.startsWith('/api/d1/committees/')) return handleD1Collection(request, env, url);
    } catch (error: any) {
      return errorJson(error?.message || 'Unexpected worker error', 500);
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
