# SamitiBook Rebrand and Language Selector Design

## Goal

Rebrand the app from PujaCommittee/Poojo-style naming to **SamitiBook** with the tagline **Transparent Festival Management**, refresh the visual system to a modern light-only blue and seagreen theme, and add an Indian-language selector for shared UI labels.

## Scope

This change covers:

- App name, tagline, document title, landing page, sidebar, header, footer, and common brand references.
- A sun logo mark used in the app chrome and browser favicon.
- Light-only visual theme using blue, seagreen, white, and a restrained warm sun accent.
- Removal of dark theme controls from the visible UI.
- A language selector for shared app UI labels, navigation labels, auth labels, common buttons, common statuses, and common messages.

This change does not attempt full page-by-page translation of every ledger field, placeholder, alert, and generated receipt in the first pass.

## Visual Direction

The UI should feel modern, simple, and trustworthy rather than festive-heavy. Replace dominant orange/red surfaces with:

- Primary blue for navigation, important headings, and main actions.
- Seagreen for success, trust, active status, and secondary accents.
- White and very light blue surfaces for cards, page backgrounds, and forms.
- A small warm sun accent for the logo only, used sparingly.

There must be no dark theme. Existing dark-theme toggles should be removed from the visible UI, and the app should render consistently in a light palette.

## Logo and Favicon

Create a simple sun logo:

- Circular sun center.
- Short rays or ring treatment.
- Works at favicon size.
- Pairs with the text **SamitiBook** in sidebar and landing surfaces.

The favicon should be updated to the same mark so browser tabs and installed PWA surfaces carry the new identity.

## Language Feature

Use the existing `LanguageContext` as the foundation, but clean it up:

- Replace corrupted translation strings with valid Unicode.
- Store language choice in local storage under a SamitiBook-specific key.
- Add a compact language selector in the authenticated header and on public/auth pages where practical.
- Supported first-pass languages:
  - English
  - Hindi
  - Bengali
  - Tamil
  - Telugu
  - Marathi
  - Gujarati
  - Kannada
  - Malayalam
  - Odia
  - Punjabi
  - Assamese
  - Urdu

The first pass translates shared labels only: app name, tagline, navigation, login/register labels, common form actions, common statuses, common errors, and common dashboard metric labels. If a page-specific string has no translation yet, it should gracefully fall back to English.

## Component Plan

Add or update these shared pieces:

- `BrandLogo`: reusable sun mark plus optional wordmark/tagline.
- `LanguageSelector`: accessible select/menu backed by `LanguageContext`.
- Theme tokens in `src/index.css`.
- Navigation/header usage in `Navbar`, `Layout`, `Landing`, `Login`, `MemberLogin`, and `Register`.

Existing pages should keep their workflows intact. The refresh should prioritize shared components and theme tokens so the UI changes broadly without risky page rewrites.

## Data and Persistence

Language preference is client-only and stored in local storage. No Firestore schema changes are needed.

## Error Handling

If a translation key is missing, `t(key)` should fall back to the English translation and then to the key itself. This keeps incomplete language dictionaries from breaking the UI.

## Testing

Verification should include:

- Typecheck/build.
- Existing safe E2E smoke tests.
- A UI smoke check that confirms SamitiBook branding appears.
- A language selector smoke check that changes language and confirms at least one shared nav/action label updates.
- Favicon/logo files are present in the build.

## Open Decisions

None. The approved approach is the focused rebrand plus shared UI translation layer.
