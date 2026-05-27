# SamitiBook

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
- `RESEND_API_KEY`: Resend email provider for admin registration verification codes.
- `RESEND_FROM_EMAIL`: Optional sender address for verification emails.
- `APP_URL`: deployed app URL.

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
