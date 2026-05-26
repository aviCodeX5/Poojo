# Onboarding Popups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mandatory educational popups before registration and member login, and improve duplicate committee validation by nearby location.

**Architecture:** Add one reusable `OnboardingDialog` component and use it from `Landing`. Keep navigation state in `Landing`. Add a small distance helper in `Register` for duplicate location detection without changing Firestore schema.

**Tech Stack:** React, TypeScript, Firebase Firestore, Playwright.

---

### Task 1: Landing Popup Tests

**Files:**
- Modify: `tests/example.spec.ts`

- [ ] Add tests asserting Register Committee opens a dialog with “Before you register”, then clicking “I understand, continue” navigates to `/register`.
- [ ] Add tests asserting Member Login opens a dialog with “Before member login”, then clicking “I understand, continue” navigates to `/member-login`.
- [ ] Run `npm exec -- playwright test tests/example.spec.ts --project=chromium --reporter=line` and confirm the new tests fail before implementation.

### Task 2: Reusable Dialog

**Files:**
- Create: `src/components/ui/OnboardingDialog.tsx`

- [ ] Create a keyboard-accessible fixed overlay dialog using `role="dialog"` and `aria-modal="true"`.
- [ ] Props: `open`, `title`, `intro`, `sections`, `onCancel`, `onContinue`, `continueLabel`.
- [ ] Render simple section cards with headings and bullets.

### Task 3: Landing Integration

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] Replace direct `Link` wrappers for Register Committee and Member Login with buttons.
- [ ] Register button opens registration dialog.
- [ ] Member Login button opens member dialog.
- [ ] Continue buttons navigate with `useNavigate`.
- [ ] Keep the visible button labels unchanged.

### Task 4: Duplicate Location Validation

**Files:**
- Modify: `src/pages/Register.tsx`

- [ ] Add `distanceInMeters` helper using the Haversine formula.
- [ ] After `name + city` check, if selected coordinates exist, query same city and puja type.
- [ ] Block registration if an existing committee has `pandalLatLng` within 75 meters.
- [ ] Use a clear alert: “A committee already appears to be registered at or very near this location. Please contact the existing admin or choose the correct location.”

### Task 5: Verify and Commit

**Files:**
- All changed files.

- [ ] Run targeted test: `npm exec -- playwright test tests/example.spec.ts --project=chromium --reporter=line`.
- [ ] Run full safe verification: `npm run verify`.
- [ ] Commit with `git commit -m "Add onboarding popups for public entry points"`.
