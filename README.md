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
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`
4. Run the app:
   `npm run dev`

## Cloudflare Pages Deployment

This project is ready to deploy as a static site.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Cloudflare Pages, create a new project and connect your repo.
3. Set the build command to:
   `npm run build`
4. Set the build output directory to:
   `dist`
5. Add environment variables in Cloudflare Pages for the same values in `.env.local`.
6. Add your Cloudflare Pages domain to Firebase Authentication authorized domains.
7. Deploy the site.

### Notes

- `firebase-applet-config.json` is now ignored in source control; use environment variables instead.
- `GEMINI_API_KEY` is optional for this app unless you add Gemini / AI features.
- `APP_URL` should be the final production URL for your deployed site, such as:
  - `https://your-app.pages.dev`
  - `https://app.yourdomain.com`
- If you use Firebase Authentication with phone login, ensure the deployed domain is authorized in Firebase and that reCAPTCHA can load successfully.
- Cloudflare Pages SPA routing is supported using `public/_redirects` with this rule:
  - `/* /index.html 200`
- If you later add a custom domain, make sure that custom domain is also added to Firebase authorized domains.
