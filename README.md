<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7caf588d-0c59-4ef4-9b6d-ba34101a0e87

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy environment settings:
   `cp .env.example .env.local`
3. Fill in your keys in `.env.local`:
   - `GEMINI_API_KEY` (optional unless AI features are used)
   - `APP_URL` (your production site URL)
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`
4. Run the app:
   `npm run dev`

## Cloudflare Workers Deployment

This project is ready to deploy as a Cloudflare Workers app with Cloudinary-backed file storage.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Cloudflare Workers, create or connect your worker project.
3. Set the build command to:
   `npm run build`
4. Set the build output directory to:
   `dist`
5. Add environment variables in Workers for the same Firebase values in `.env.local`.
6. Add `CLOUDINARY_URL` as a Worker secret or environment variable. Do not expose it with a `VITE_` prefix.
7. Add the `workers.dev` domain to Firebase Authentication authorized domains.
8. Deploy the site.

### Notes

- File uploads use Cloudinary through the Cloudflare Worker endpoint at `/api/cloudinary/upload`.
- `firebase-applet-config.json` is now ignored in source control; use environment variables instead.
- `GEMINI_API_KEY` is optional for this app unless you add Gemini / AI features.
- `APP_URL` should be the final production URL for your deployed site, such as:
  - `https://samitibook.mpcu.workers.dev`
- If you use Firebase Authentication with phone login, ensure the deployed domain is authorized in Firebase and that reCAPTCHA can load successfully.
- If you later add a custom domain, make sure that custom domain is also added to Firebase authorized domains.
