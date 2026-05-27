# D1 Only Auth And Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Firebase completely and run authentication plus all app data through Cloudflare D1 and Worker APIs.

**Architecture:** The browser talks only to the Worker. The Worker owns D1 queries, sessions, admin password hashing, Resend registration OTP, Cloudinary uploads, and collection CRUD. Existing pages keep their UI but swap Firestore calls for a small API client.

**Tech Stack:** React, TypeScript, Cloudflare Workers, Cloudflare D1, Resend, Cloudinary, Playwright.

---

### Task 1: Regression Guards

**Files:**
- Modify: `tests/example.spec.ts`
- Create: `scripts/assertNoFirebase.ts`
- Modify: `package.json`

- [x] Add a script that fails if source/package/env examples still reference Firebase.
- [x] Add the script to verification.
- [x] Run the script and confirm it fails before migration.

### Task 2: D1 Schema And Worker API

**Files:**
- Modify: `migrations/0001_initial_schema.sql`
- Modify: `scripts/seedDemoD1.sql`
- Modify: `src/worker.ts`

- [x] Add `admin_users` and `pending_admin_registrations`.
- [x] Add password hashing and verification helpers.
- [x] Add admin registration start/confirm endpoints with Resend OTP.
- [x] Add admin login endpoint.
- [x] Extend collection APIs to support create, update, delete.
- [x] Add audit log support.

### Task 3: Frontend API Client And Auth

**Files:**
- Create: `src/lib/api.ts`
- Modify: `src/hooks/useAuth.tsx`
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Register.tsx`

- [x] Create a typed API client for session, auth, committee, and collection calls.
- [x] Remove Firebase auth listener and use only Worker sessions.
- [x] Make admin login use D1 email/password.
- [x] Make registration start with email/password details, then verify Resend OTP.

### Task 4: Replace Firestore Page Data

**Files:**
- Modify pages under `src/pages`
- Modify utilities under `src/utils`

- [x] Replace read-only Firestore list calls with `apiList`.
- [x] Replace add/create calls with `apiCreate`.
- [x] Replace update calls with `apiUpdate`.
- [x] Replace delete calls with `apiDelete`.
- [x] Remove Firebase messaging notifications or stub with non-Firebase audit records.

### Task 5: Remove Firebase

**Files:**
- Delete: `src/firebase.ts`
- Delete: `scripts/seedDemoFirebase.ts`
- Delete: `firestore.rules`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `src/types.ts`
- Modify: `src/utils/excelExport.ts`

- [x] Remove Firebase dependency and scripts.
- [x] Remove Firebase env vars.
- [x] Remove `firebaseUID` fields and exports.
- [x] Run npm install to update lockfile.

### Task 6: Verify And Deploy

**Files:**
- All changed files

- [x] Run migrations and seed D1.
- [x] Run `npm run verify`.
- [x] Run no-Firebase guard.
- [x] Deploy with Wrangler.
- [x] Smoke-test production duplicate registration protection, admin login, member login, and demo data.
- [ ] Commit verified migration.
