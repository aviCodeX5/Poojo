# OpenLayers Map Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Google Maps usage with OpenLayers and OpenStreetMap tiles while preserving registration location selection.

**Architecture:** Keep the existing `GoogleMaps` component filename for compatibility during this phase, but replace its internals with OpenLayers. The component will support text search through OpenStreetMap Nominatim, click-to-select coordinates, and return `{ lat, lng, address }` to the registration form.

**Tech Stack:** React, TypeScript, OpenLayers (`ol`), OpenStreetMap/Nominatim, Playwright.

---

### Task 1: Add Failing OpenLayers Test

**Files:**
- Modify: `tests/example.spec.ts`

- [ ] Add a test that opens `/register`, checks that the map area says OpenStreetMap/OpenLayers, and confirms no Google Maps setup is required.
- [ ] Run `npm exec -- playwright test tests/example.spec.ts --project=chromium --reporter=line`.
- [ ] Expected: FAIL because the component still uses Google Maps copy/behavior.

### Task 2: Add OpenLayers Dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Install `ol` with `npm install ol`.
- [ ] Keep existing dependencies otherwise unchanged.

### Task 3: Replace Map Implementation

**Files:**
- Modify: `src/components/GoogleMaps.tsx`
- Modify: `src/main.tsx`
- Modify: `.env.example`
- Modify: `vite-env.d.ts`

- [ ] Remove Google Maps script-loading from `src/main.tsx`.
- [ ] Remove `VITE_GOOGLE_MAPS_API_KEY` from examples/types.
- [ ] Implement OpenLayers map with OSM tile layer and default view centered on Kolkata.
- [ ] On map click, convert Web Mercator to lon/lat and call `onLocationSelect`.
- [ ] Add a search box using Nominatim JSON search and update the marker/view on selection.
- [ ] Show selected location text so existing registration tests continue working.

### Task 4: Verify and Commit

**Files:**
- All changed files.

- [ ] Run targeted test: `npm exec -- playwright test tests/example.spec.ts --project=chromium --reporter=line`.
- [ ] Run full safe verification: `npm run verify`.
- [ ] Search for Google Maps usage: `rg "Google Maps|google.maps|VITE_GOOGLE_MAPS_API_KEY|maps.googleapis" src tests .env.example vite-env.d.ts`.
- [ ] Commit with `git commit -m "Replace Google Maps with OpenLayers"`.
