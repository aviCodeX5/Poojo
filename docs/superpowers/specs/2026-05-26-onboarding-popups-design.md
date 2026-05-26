# Onboarding Popups and Duplicate Committee Validation Design

## Goal

Add mandatory, simple onboarding popups before public users enter committee registration or member login, and strengthen duplicate committee validation so the same real committee/location is not created twice.

## Registration Popup

Clicking **Register Committee** on the landing page opens a modal before navigation. The modal explains:

- Registration creates a new festival committee workspace.
- One committee should have one primary admin account.
- One real committee/location should not be registered more than once.
- Admins manage committee profile, members, roles, finance records, broadcasts, settings, and demo/operational data.
- Users should register only if they are authorized to manage that committee.

The user must click **I understand, continue** to navigate to `/register`. The modal can be cancelled to stay on the landing page.

## Member Login Popup

Clicking **Member Login** opens a modal before navigation. The modal explains:

- Members log in with the phone number added by their committee admin.
- Members can view committee data according to their assigned role.
- Some roles can add collections, donations, expenses, inventory, cultural events, mandap schedules, or broadcasts.
- Members should not use another person’s phone number or share OTPs.

The user must click **I understand, continue** to navigate to `/member-login`. The modal can be cancelled to stay on the landing page.

## Duplicate Validation

Keep the existing duplicate committee check by `name + city`. Add a location-based check during registration:

- When selected map coordinates exist, query committees for the same city and puja type.
- If any existing committee has coordinates within about 75 meters of the selected location, block registration.
- Show a clear alert explaining that a committee already appears to exist at or near that location.

This is a client-side validation improvement, not a replacement for future server-side uniqueness guarantees.

## Components

Add a reusable `OnboardingDialog` component for both popups. The landing page owns the modal state and passes content/actions. Keep copy short, plain, and non-technical.

## Testing

Add Playwright coverage that verifies:

- Register button opens the registration popup instead of immediately navigating.
- Continuing from the popup navigates to `/register`.
- Member Login button opens the member popup instead of immediately navigating.
- Continuing from the popup navigates to `/member-login`.

Add focused validation coverage through existing registration flow code where practical. Full duplicate-location Firestore setup is not required in the first browser smoke because it would create live demo data.
