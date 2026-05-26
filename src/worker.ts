export interface Env {
  CLOUDINARY_URL?: string;
}

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
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

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/cloudinary/upload')) {
      return handleCloudinaryUpload(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};
