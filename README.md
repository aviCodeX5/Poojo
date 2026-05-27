# Pooja Samiti

Transparent Festival Management for committees.

## Run Locally

Prerequisite: Node.js.

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment

Server-side secrets are used by the Cloudflare Worker:

- `CLOUDINARY_URL`: Cloudinary uploads for bills and media.
- `RESEND_API_KEY`: Resend email provider for admin registration verification codes. Store it as a Cloudflare Worker secret.
- `RESEND_FROM_EMAIL`: Production sender for verification emails. The default is `Pooja Samiti <no-reply@poojasamiti.online>`.
- `APP_URL`: deployed app URL.

## Production Email

For every user to register with their own email, `poojasamiti.online` must be added and verified in Resend. Resend requires SPF and DKIM DNS records for the sending domain; after the domain is verified, the app can send OTP emails from any address on that domain, including `no-reply@poojasamiti.online`.

## Cloudflare

The app deploys as a Cloudflare Workers app with static assets, D1 database, Resend email verification, and Cloudinary uploads.

Useful commands:

```bash
npm run d1:migrate:local
npm run d1:seed:local
npm run d1:migrate:remote
npm run d1:seed:remote
npm run deploy
```

## AI Features

There are currently no active AI features in the app.
