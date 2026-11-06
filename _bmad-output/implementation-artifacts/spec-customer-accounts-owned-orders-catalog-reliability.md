---
title: 'Customer Accounts, Owned Orders, and Reliable Catalog'
type: 'feature'
created: '2026-11-05'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'ba04799c6946a585dfdf9af98fb66111d02d7293'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Johari can appear unavailable because the storefront is not reliably connected to the API and a fresh database requires a manual product seed. Orders are guest records exposed by reference, so customers have no private account or personal order history.

**Approach:** Make the approved product self-provisioning and the local/production API boundary explicit, then add secure email/password customer accounts whose authenticated identity owns checkout, order status, and order history. Keep the current visual design and M-Pesa/pickup flow.

## Boundaries & Constraints

**Always:** Preserve the approved Johari data, price, palette, modular `frontend/` and `backend/` structure, vertical formatting, and 500-line file limit. Require authentication for checkout and all customer-readable order routes. Use normalized unique email, strong password hashing, revocable random sessions stored only as hashes, and `HttpOnly`, `SameSite=Lax`, production-secure cookies. Scope every order query by authenticated customer ID while retaining the customer snapshot used for fulfillment. Automatically and idempotently provision Johari after MongoDB connects; use a Vite proxy locally and documented API origin/rewrite in production.

**Never:** Store passwords or session tokens in browser storage or plaintext, expose password hashes, trust browser-supplied customer identity, allow one customer to discover another customer's order, auto-claim legacy guest orders by matching email, fabricate client-side products/prices, add social login, password reset, email verification, admin tooling, or migrate existing guest records without verified ownership.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Fresh catalog | Connected empty MongoDB | Approved Johari product is upserted and public catalog/detail APIs return it | Startup fails clearly if MongoDB/bootstrap fails; UI distinguishes outage from missing product |
| Register/login | Valid or duplicate/invalid credentials | Account receives a revocable cookie session and `/auth/me` returns safe profile data | Generic credential errors, validation feedback, tight auth rate limits, no secret leakage |
| Protected checkout | Signed-in customer with cart | Server derives account identity, persists `customerId` and snapshot, prices items, and starts M-Pesa | Anonymous request is 401; failure preserves cart and form data |
| Order isolation | Two customers with separate orders | Each history/detail request returns only the current customer's orders | Foreign/unknown references return the same non-disclosing 404 response |
| Session lifecycle | Refresh, expiry, logout, disabled account | Valid session restores; expired/revoked session becomes anonymous; logout clears cookie | UI redirects to login while preserving intended route |
| Legacy guest order | Order has no `customerId` | It remains hidden from account histories | No automatic email-based ownership assignment |

</frozen-after-approval>

## Code Map

- `frontend/src/api.js` -- add credentialed requests and consistent 401/error behavior; relative API currently has no dev proxy.
- `frontend/vite.config.js` -- proxy `/api/v1` to Express during local development.
- `frontend/src/main.jsx`, `App.jsx`, `components/Layout.jsx` -- mount session state, protect checkout/order routes, and expose account navigation.
- `frontend/src/features/auth/` -- new session context, protected route, registration, and login views.
- `frontend/src/pages/CommercePages.jsx` -- authenticated checkout identity, outage/missing-product distinction, and owned order history/detail UX.
- `backend/src/server.js`, `scripts/seedProducts.js`, `modules/products/` -- extract approved Johari definition and idempotent startup catalog bootstrap.
- `backend/src/app.js`, `config/env.js` -- cookie parsing, credentialed CORS, auth rate limiting, and session configuration.
- `backend/src/modules/customers/` and `modules/auth/` -- new customer/session models and register/login/logout/me middleware/routes.
- `backend/src/modules/orders/` and `modules/routes.js` -- require customer ownership, derive identity server-side, list owned orders, and prevent reference enumeration.
- `backend/src/app.test.js` and frontend feature tests -- extend the current model-isolated API and Testing Library coverage.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/modules/products/` and `backend/src/server.js` -- centralize Johari fixture and upsert it on startup after MongoDB connects.
- [x] `frontend/vite.config.js`, environment examples, and `README.md` -- make local proxy and production API routing/deployment requirements executable and documented.
- [x] `backend/src/modules/customers/` and `backend/src/modules/auth/` -- implement customers, hashed passwords, hashed revocable sessions, cookie lifecycle, auth schemas/middleware/routes, and safe profile serialization.
- [x] `backend/src/modules/orders/` and `backend/src/modules/routes.js` -- bind new orders to authenticated customers, derive snapshots from accounts, list owned orders, and owner-scope details.
- [x] `frontend/src/features/auth/`, `main.jsx`, `App.jsx`, and `Layout.jsx` -- restore sessions, register/login/logout, preserve return paths, protect customer routes, and show account-aware navigation.
- [x] `frontend/src/pages/CommercePages.jsx` -- require accounts at checkout, prefill identity, preserve cart/errors, distinguish catalog failures, and add personal order history/detail states.
- [x] `frontend/**/*.test.*` and `backend/**/*.test.*` -- cover every matrix row including catalog bootstrap, cookie security/lifecycle, duplicate credentials, cross-customer isolation, protected checkout, history, and legacy-order exclusion.
- [x] Documentation and line check -- update environment/setup/deployment guidance and keep every authored source file below 500 lines.

**Acceptance Criteria:**
- Given a fresh configured database, when the API starts, then Johari is available without running a separate seed command and repeated starts do not duplicate it.
- Given an anonymous visitor, when they attempt checkout or an account order route, then they are sent to sign in and returned to the intended route after authentication.
- Given two authenticated customers, when either lists or opens orders, then only their own records are returned and foreign references disclose no existence information.
- Given logout or session expiry, when a protected request occurs, then the server rejects it and the frontend returns to an anonymous state without losing the local cart.
- Given the completed tree, when verification runs, then lint, frontend/backend tests, build, and the 500-line check all pass.

## Implementation Notes

- Centralized Johari data and added idempotent startup provisioning so an empty configured database serves the approved product without a manual seed command.
- Added scrypt password hashing, opaque random sessions stored only as SHA-256 hashes, HTTP-only cookie lifecycle, credentialed CORS, and customer/session models.
- Protected checkout and all customer order endpoints; order creation derives identity from the authenticated account and every list/detail query includes `customerId`.
- Added registration, login, logout, session restoration, protected return paths, account navigation, private order history, and authenticated checkout while retaining the device-local cart.
- Verification passed: frontend lint, 14 frontend tests, production build, 23 backend tests, and the 500-line check across 53 authored source files.

## Spec Change Log

## Review Triage Log

- BH-01 fixed (high): corrected the post-authentication fallback to `/account/orders`.
- BH-02 fixed (high): protected-request 401 responses now clear global customer state.
- BH-03 fixed (medium): the manual seed command now reuses the canonical catalog provisioner.
- BH-04 rejected (not a defect): `customerId` remains schema-optional only for legacy guest records; all new orders set it from the authenticated session.
- BH-05 fixed (high): unknown-account login performs the same scrypt verification work using a dummy hash.
- BH-06 fixed (high): malformed stored password hashes return false without throwing.
- BH-07 fixed (high): payment initiation failure persists the order as failed before propagating the error.
- BH-08 fixed (medium): removed the unused customer phone field; checkout still validates the per-order M-Pesa number.
- BH-09 fixed (low): cart and checkout metadata now describe authenticated customer checkout.
- BH-10 fixed (low): documented the comma-separated frontend origin allowlist and same-site deployment requirement.
- BH-11 fixed (medium): added distinct expired/revoked-query and disabled-customer lifecycle coverage.
- BH-12 fixed (medium): added startup ordering and no-listen-on-provisioning-failure tests.
- BH-13 fixed (medium): logout always clears frontend customer state, including request failures.
- EH-01 fixed (high): corrected the post-authentication fallback route.
- EH-02 fixed (high): global 401 notification prevents stale authenticated UI state.
- EH-03 fixed (high): the backend clears the session cookie even when database revocation fails.
- EH-04 fixed (high): malformed password hashes are safely rejected.
- EH-05 fixed (medium): malformed percent-encoded cookies are treated as unauthenticated.
- EH-06 fixed (high): failed Daraja initiation is persisted and covered by an API test.
- EH-07 fixed (medium): session lookup constraints and disabled-customer behavior are covered separately.
- VG-01 fixed (high): injectable startup tests prove connect/provision/listen order and failure behavior.
- VG-02 fixed (medium): GET and POST tests assert credentialed API requests.
- VG-03 fixed (medium): the real login flow test asserts restoration of pathname and query string.
- VG-04 fixed (medium): production cookie tests assert HttpOnly, SameSite, Secure, and configured lifetime.

## Design Notes

Use opaque cookie sessions rather than browser JWTs so logout and account disabling are immediately enforceable. New authenticated orders always receive an indexed `customerId` from the session; the schema remains optional solely so pre-existing guest orders can stay unclaimed and hidden from customer-facing endpoints. Keep the cart device-local across sign-in/out, but never treat it as identity or order history.

## Verification

**Commands:**
- `npm run lint --prefix frontend` -- expected: no lint errors.
- `npm run test --prefix frontend -- --run` -- expected: all account/catalog/commerce tests pass.
- `npm run build --prefix frontend` -- expected: production bundle builds.
- `npm test --prefix backend` -- expected: all auth/catalog/order isolation tests pass.
- `npm run check:lines` -- expected: every authored source file is below 500 lines.

