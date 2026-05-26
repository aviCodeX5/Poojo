# SamitiBook Rebrand and Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the app to SamitiBook, apply a light blue/seagreen visual system with a sun logo/favicon, and add first-pass Indian-language switching for shared UI labels.

**Architecture:** Keep the current React/Vite/Firebase structure. Add small shared brand and language components, update global theme tokens, and use the existing language context as the translation source with English fallback.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4 theme tokens, Playwright.

---

### Task 1: Add Brand and Language Smoke Tests

**Files:**
- Modify: `tests/example.spec.ts`
- Modify: `tests/e2e/demo.spec.ts`

- [ ] **Step 1: Write failing branding and language tests**

Add assertions that the public landing page shows `SamitiBook`, `Transparent Festival Management`, and a language selector. Add an authenticated demo assertion that changing language updates a shared nav label.

```ts
await expect(page.getByText('SamitiBook').first()).toBeVisible();
await expect(page.getByText('Transparent Festival Management').first()).toBeVisible();
await expect(page.getByLabel('Language')).toBeVisible();
await page.getByLabel('Language').selectOption('hi');
await expect(page.getByRole('link', { name: /डैशबोर्ड/i })).toBeVisible();
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm exec -- playwright test tests/example.spec.ts tests/e2e/demo.spec.ts --project=chromium --reporter=line`

Expected: FAIL because SamitiBook branding and the language selector are not implemented yet.

- [ ] **Step 3: Leave tests failing for implementation tasks**

Do not weaken assertions. Use these failures to guide the implementation.

### Task 2: Add Shared Brand Components and Assets

**Files:**
- Create: `src/components/brand/BrandLogo.tsx`
- Create: `public/favicon.svg`
- Modify: `index.html`

- [ ] **Step 1: Implement `BrandLogo`**

Create a reusable component that renders a simple sun mark, wordmark, and optional tagline using `lucide-react` only where useful and CSS for the sun.

```tsx
export function BrandLogo({ showTagline = false, compact = false }: { showTagline?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-sun text-white shadow-sm shadow-sun/20">
        <span className="absolute h-14 w-14 rounded-full border-2 border-sun/25" />
        <span className="h-4 w-4 rounded-full bg-white" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="text-xl font-black tracking-tight text-slate-900">SamitiBook</div>
          {showTagline && <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-seagreen">Transparent Festival Management</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add sun favicon**

Create `public/favicon.svg` with a blue/seagreen-safe sun mark.

- [ ] **Step 3: Update document title/favicon**

Set `index.html` title to `SamitiBook | Transparent Festival Management` and link `/favicon.svg`.

### Task 3: Replace Theme Tokens and Remove Dark UI

**Files:**
- Modify: `src/index.css`
- Modify: `src/contexts/ThemeContext.tsx`
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Update CSS theme tokens**

Replace orange/red tokens with blue/seagreen/sun tokens while keeping old token names mapped safely for existing classes.

```css
--color-primary: #2563eb;
--color-accent: #0f766e;
--color-accent-dark: #115e59;
--color-background-cream: #f6fbff;
--color-orange-100: #dbeafe;
--color-seagreen: #0f766e;
--color-sun: #f5b942;
```

- [ ] **Step 2: Disable dark theme behavior**

Make `ThemeContext` always apply `light`, keep API compatibility, and store a SamitiBook-specific key.

- [ ] **Step 3: Remove sidebar dark toggle**

Remove the dark-mode button and its `Moon`/theme usage from `Navbar`.

### Task 4: Clean Language Context and Add Selector

**Files:**
- Modify: `src/contexts/LanguageContext.tsx`
- Create: `src/components/language/LanguageSelector.tsx`
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Replace corrupted dictionaries**

Define `LanguageCode`, `LANGUAGES`, English fallback, and first-pass shared labels for supported Indian languages.

```ts
export type LanguageCode = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'or' | 'pa' | 'as' | 'ur';
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'as', label: 'অসমীয়া' },
  { code: 'ur', label: 'اردو' },
] as const;
```

- [ ] **Step 2: Implement fallback in `t`**

Return `translations[language][key] || translations.en[key] || key`.

- [ ] **Step 3: Add `LanguageSelector`**

Render an accessible `select` with `aria-label="Language"` and compact styling.

- [ ] **Step 4: Add selector to authenticated header and sidebar/footer area**

Use it in `Layout` header and public/auth screens in later tasks.

### Task 5: Rebrand Public and Auth Pages

**Files:**
- Modify: `src/pages/Landing.tsx`
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/MemberLogin.tsx`
- Modify: `src/pages/Register.tsx`

- [ ] **Step 1: Replace public branding**

Use `BrandLogo`, `LanguageSelector`, `SamitiBook`, and `Transparent Festival Management`.

- [ ] **Step 2: Keep workflows unchanged**

Do not alter form submission, Firebase calls, route paths, or validation behavior.

- [ ] **Step 3: Ensure no dark surfaces**

Use light blue/white/seagreen styling only.

### Task 6: Rebrand App Chrome and Shared Labels

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Settings.tsx`
- Search/replace safe brand strings across `src`, `tests`, `README` if present.

- [ ] **Step 1: Replace `PujaCommittee`, `Poojo`, and old taglines**

Use `SamitiBook` and `Transparent Festival Management` everywhere visible.

- [ ] **Step 2: Translate shared nav labels**

Use `t('nav.dashboard')`, `t('nav.members')`, and equivalent keys in navigation.

- [ ] **Step 3: Preserve domain terms**

Keep functional domain labels like `Chanda`, `Puja Editions`, and committee names where they are data/domain terms.

### Task 7: Verify and Commit

**Files:**
- All changed files.

- [ ] **Step 1: Run targeted Playwright tests**

Run: `npm exec -- playwright test tests/example.spec.ts tests/e2e/demo.spec.ts --project=chromium --reporter=line`

Expected: PASS.

- [ ] **Step 2: Run full safe verification**

Run: `npm run verify`

Expected: PASS with existing large chunk warning only.

- [ ] **Step 3: Search for old public branding**

Run: `rg "PujaCommittee|Poojo|Committee OS|Committee Management System" src public index.html tests`

Expected: no unwanted visible-brand matches.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add .
git commit -m "Rebrand app as SamitiBook"
```
