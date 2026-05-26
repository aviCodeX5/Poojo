# Member Login Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins create and view permanent member login codes without weakening existing Firestore rules.

**Architecture:** Add a `loginCode` field to member records at creation time, show the code in the admin member list, and let admins generate or regenerate a code for existing members. Actual public phone+code login will be implemented in the D1 worker auth phase so member codes are verified server-side instead of exposed through unauthenticated Firestore access.

**Tech Stack:** React, TypeScript, Firebase Firestore client, Playwright, demo Firebase seed script.

---

### Task 1: Seeded Demo Visibility

**Files:**
- Modify: `tests/e2e/demo.spec.ts`
- Modify: `scripts/seedDemoFirebase.ts`

- [x] **Step 1: Write the failing Playwright assertion**

Add a check that the seeded admin can see a member login code on the Members page.

- [x] **Step 2: Run the targeted demo test and confirm it fails**

Run the demo smoke test before adding seeded codes.

- [x] **Step 3: Add deterministic demo login codes**

Seed stable, readable codes for every demo member.

- [x] **Step 4: Re-run the targeted demo test**

Confirm the test can observe the seeded code.

### Task 2: Admin Code Management

**Files:**
- Modify: `src/types.ts`
- Modify: `src/pages/Members.tsx`

- [x] **Step 1: Extend the member type**

Add optional `loginCode` to `Member`.

- [x] **Step 2: Generate codes for newly added members**

Create a short alphanumeric permanent login code during admin member creation.

- [x] **Step 3: Display codes in the member card**

Show the login code in a clear admin-only row and include it in the WhatsApp invite text.

- [x] **Step 4: Add code generation/regeneration**

For existing members without a code, allow generating one; for existing coded members, allow regeneration after confirmation.

- [x] **Step 5: Verify**

Run lint, targeted Playwright smoke, build, and the full verification command.

### Task 3: Commit

**Files:**
- All changed files

- [x] **Step 1: Inspect the diff**

Ensure no secrets or unrelated changes were introduced.

- [ ] **Step 2: Commit**

Commit the member-code admin flow separately from the D1 migration.
