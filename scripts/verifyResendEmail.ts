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
  prepare() {
    return {
      bind() {
        return {
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
    new Request('https://samitibook.test/api/auth/email-verification/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo.admin@samitibook.app' }),
    }),
    {
      DB: fakeDb,
      RESEND_API_KEY: 're_test_secret',
      RESEND_FROM_EMAIL: 'SamitiBook <verify@samitibook.app>',
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
  assert(call.body.from === 'SamitiBook <verify@samitibook.app>', 'Expected configured sender');
  assert(call.body.to === 'demo.admin@samitibook.app', 'Expected target email');
  assert(String(call.body.subject).includes('SamitiBook'), 'Expected SamitiBook subject');
  assert(String(call.body.text).includes('verification code'), 'Expected verification text');
}

main()
  .finally(() => {
    globalThis.fetch = originalFetch;
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
