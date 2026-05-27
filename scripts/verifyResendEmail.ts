import worker from '../src/worker';

const originalFetch = globalThis.fetch;
const resendCalls: Array<{ url: string; init?: RequestInit; body: any }> = [];

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const body = init?.body ? JSON.parse(String(init.body)) : null;
  resendCalls.push({ url: String(input), init, body });
  return new Response(JSON.stringify({ id: 'email_test_123' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

const fakeDb = {
  calls: [] as string[],
  prepare() {
    return {
      bind() {
        return {
          async first() {
            return null;
          },
          async run() {
            return { success: true };
          },
        };
      },
    };
  },
};

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const response = await worker.fetch(
    new Request('https://poojasamiti.online/api/auth/email-verification/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo.admin@poojasamiti.online' }),
    }),
    {
      DB: fakeDb,
      RESEND_API_KEY: 're_test_secret',
      RESEND_FROM_EMAIL: 'Pooja Samiti <verify@poojasamiti.online>',
    } as any,
  );

  assert(response.status === 200, `Expected 200, received ${response.status}`);
  const json = await response.json() as any;
  assert(json.delivery === 'sent', `Expected sent delivery, received ${json.delivery}`);
  assert(json.developmentCode === undefined, 'Production response must not expose the verification code');
  assert(resendCalls.length === 1, `Expected one Resend call, received ${resendCalls.length}`);

  const call = resendCalls[0];
  assert(call.url === 'https://api.resend.com/emails', `Unexpected Resend URL: ${call.url}`);
  assert(call.init?.method === 'POST', 'Expected Resend POST request');
  assert((call.init?.headers as Record<string, string>).Authorization === 'Bearer re_test_secret', 'Expected bearer API key header');
  assert(call.body.from === 'Pooja Samiti <verify@poojasamiti.online>', 'Expected configured sender');
  assert(call.body.to === 'demo.admin@poojasamiti.online', 'Expected target email');
  assert(String(call.body.subject).includes('Pooja Samiti'), 'Expected Pooja Samiti subject');
  assert(String(call.body.text).includes('verification code'), 'Expected verification text');
}

async function verifiesRegistrationEmailFailuresStayReadable() {
  resendCalls.length = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    resendCalls.push({ url: String(input), init, body });
    return new Response(JSON.stringify({
      message: 'You can only send testing emails to your own email address',
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const response = await worker.fetch(
    new Request('https://poojasamiti.online/api/auth/admin-register/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Readable Error Committee',
        pujaType: 'Durga',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        pandalAddress: 'Noida',
        pandalLatLng: { lat: 28.564, lng: 77.334 },
        email: 'someone@example.com',
        password: 'Password123',
        adminPhone: '9876543210',
      }),
    }),
    {
      DB: fakeDb,
      RESEND_API_KEY: 're_test_secret',
      RESEND_FROM_EMAIL: 'Pooja Samiti <no-reply@poojasamiti.online>',
    } as any,
  );

  const json = await response.json() as any;
  assert(response.status === 502, `Expected 502, received ${response.status}`);
  assert(String(json.error).includes('email'), `Expected readable email error, received ${JSON.stringify(json)}`);
}

async function usesProductionDomainSenderByDefault() {
  resendCalls.length = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    resendCalls.push({ url: String(input), init, body });
    return new Response(JSON.stringify({ id: 'email_default_sender_123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const response = await worker.fetch(
    new Request('https://poojasamiti.online/api/auth/email-verification/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new.admin@example.com' }),
    }),
    {
      DB: fakeDb,
      RESEND_API_KEY: 're_test_secret',
    } as any,
  );

  assert(response.status === 200, `Expected 200, received ${response.status}`);
  assert(resendCalls[0]?.body?.from === 'Pooja Samiti <no-reply@poojasamiti.online>', 'Expected production domain default sender');
}

main()
  .then(verifiesRegistrationEmailFailuresStayReadable)
  .then(usesProductionDomainSenderByDefault)
  .finally(() => {
    globalThis.fetch = originalFetch;
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
