---
title: 'Modern MERN Commerce Rebuild'
type: 'refactor'
created: '2026-11-05'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'ee40334303e43a14baa9e351167a902005222305'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mercada Impex is a duplicated static HTML/CSS site whose deployed contact and M-Pesa checkout flows do not work, and whose single-file backend does not persist commerce data. The experience lacks a real cart, accessible mobile navigation, modern interaction design, and a maintainable frontend/backend architecture.

**Approach:** Rebuild the public site as a responsive React storefront and the server as a modular Express/MongoDB API. Preserve the established palette, content, imagery, Johari Gin pricing, M-Pesa payment direction, and Oro Kilimani pickup while modernizing layout, motion, accessibility, catalog, cart, checkout, contact, and order handling.

## Boundaries & Constraints

**Always:** Use `frontend/` and `backend/` roots; keep each source file below 500 lines; favor small feature-focused modules and vertically formatted code; retain `#3B2F2F`, `#8B3A1A`, `#5A2E1B`, `#C65D2C`, `#D4AF37`, `#FDF9F6`, existing brand assets/copy, Johari Gin at KES 5,390, guest checkout, M-Pesa, and Oro Restaurant & Lounge pickup. Make navigation, dialogs, forms, cart, and motion responsive and accessible, including reduced-motion support.

**Never:** Add an unrelated visual palette, invent additional products or company claims, expose credentials, trust client-supplied totals, retain localhost production URLs, use `send.php`, keep transient in-memory order state, or put the application into monolithic files. Customer accounts and a full admin dashboard are outside this rebuild.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Browse and cart | Product API available; Johari selected | Product details load and quantity/cart totals update | Empty/unavailable catalog shows a useful retry state |
| Guest checkout | Valid contact, Kenyan phone, cart, pickup | Server recalculates total, persists order, starts M-Pesa, and returns a trackable reference | Invalid fields or provider failure preserve cart and show actionable feedback |
| Payment callback | Success, failure, or repeated Daraja callback | Order transitions idempotently and successful orders expose receipt details | Unknown/malformed callbacks are safely acknowledged and logged |
| Contact | Valid or invalid message | Valid message is stored and accepted | Field-level validation prevents malformed submissions |
| Mongo/API outage | Network or database unavailable | UI remains navigable and reports unavailable commerce actions | No false success state or lost user-entered form data |

</frozen-after-approval>

## Code Map

- `*.html`, `styles/*.css`, `js/main.js` -- legacy pages, brand content, palette, and interaction reference; replace with React rather than extending duplicated DOM code.
- `images/*` -- approved logo, Johari gallery, hero, service, and insight assets to reuse from the frontend asset tree.
- `checkout.html` -- legacy query-string checkout and broken hard-coded localhost integration; preserve business copy only.
- `backend/server.js` -- reusable Daraja field mapping and pickup receipt copy; split configuration, routes, controllers, services, models, middleware, and utilities.
- `backend/package.json` -- replace unsafe/incorrect scripts and add MongoDB, validation, security, and test dependencies.
- `frontend/src/components/` -- shared layout, accessible navigation/drawer, controls, cards, dialogs, feedback, and motion primitives.
- `frontend/src/features/` -- catalog, cart, checkout, contact, insights, and order-status state/API modules.
- `backend/src/` -- app composition plus product, order, payment, and contact modules with centralized validation/errors.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/` -- scaffold Vite React, shared tokens/layout, routed pages, reusable components, accessible animated hamburger, SEO metadata, and responsive styles.
- [x] `frontend/src/features/catalog/` and `frontend/src/features/cart/` -- implement API catalog, Johari gallery/quick view, persistent cart, quantity controls, and computed presentation totals.
- [x] `frontend/src/features/checkout/` -- implement validated guest checkout, M-Pesa initiation, status polling, confirmation, retry, and pickup guidance without hard-coded server URLs.
- [x] `frontend/src/features/contact/` and content routes -- migrate company, services, Johari, insights, and contact content into modular React views backed by real form handling.
- [x] `backend/src/` -- create modular Express app, environment validation, secure middleware, API versioning, health checks, and centralized errors.
- [x] `backend/src/modules/products/`, `orders/`, `payments/`, and `contacts/` -- add Mongoose models, validated APIs, server-side pricing, idempotent Daraja callbacks, status lookup, and mail integration.
- [x] `backend/src/scripts/seedProducts.js` -- idempotently seed Johari Gin and its approved media/content.
- [x] `frontend/**/*.test.*` and `backend/**/*.test.*` -- cover navigation/cart/forms and API validation, totals, callbacks, and failure states.
- [x] Root documentation/configuration -- document setup, environment variables, development commands, production API configuration, seeding, and deployment boundaries.

**Acceptance Criteria:**
- Given any viewport from mobile through desktop, when a visitor navigates the site, then content is readable, navigation is keyboard-accessible, the animated drawer closes predictably, and no horizontal overflow appears.
- Given the preserved legacy content and assets, when the rebuilt routes render, then the brand palette, Johari story, company services, contacts, product price, and pickup location remain accurate while shared UI replaces duplicated markup.
- Given an item in the cart, when checkout completes through the API, then the authoritative server total is persisted and payment status can survive a server restart.
- Given missing credentials or infrastructure, when the app starts or a dependent action runs, then it fails clearly without leaking secrets or fabricating success.
- Given the completed source tree, when file lengths are checked, then every authored source file is under 500 lines and frontend/backend concerns remain separated.

## Implementation Notes

- Replaced the legacy static pages and in-memory server with a Vite React application and versioned Express/Mongoose API.
- Preserved approved brand assets and palette under `frontend/public/assets`; removed migrated legacy files from the repository root.
- Added server-authoritative totals, validated Kenyan phone normalization, persisted order/payment state, idempotent callbacks, CORS/Helmet/rate limiting, and optional SMTP mail.
- Corrected Express 5 request validation semantics and verified checkout sends pickup location outside the customer object.
- Verification passed after review fixes: frontend lint, 7 frontend tests, frontend production build, 9 backend tests, and the line-length check across 36 authored source files.

## Spec Change Log

## Review Triage Log

- `low` — “Global Commodity Outlook 2025” is dated, but it is preserved approved legacy content rather than a factual 2026 claim; retained without inventing a replacement article.
- `medium` — “Top 5 Logistics Trends” had only a generic summary; patched by restoring the legacy detail in expandable insight content.
- `medium` — insight cards were dead ends; patched with accessible expandable article content.
- `medium` — “Building Resilient Supply Chains” was dropped; patched by restoring the approved topic and copy.
- `medium` — Johari origins, botanicals, heritage, and recognition content was reduced; patched with structured story data and product-page sections.
- `medium` — core values reused awkward boilerplate; patched with each approved value description.
- `medium` — pickup lacked actionable directions; patched with the established Oro Google Maps destination link.
- `medium` — checkout lacked itemized confirmation before payment; patched with item, quantity, line-total, and total presentation.
- `medium` — order confirmation lacked authoritative total and useful collection details; patched with total, receipt state, and directions.
- `low` — office address was plain text; patched directly with an actionable directions link.
- `low` — established Facebook, Instagram, and X links were removed; patched by restoring them while keeping the placeholder LinkedIn URL excluded.
- `medium` — SPA routes shared generic metadata; patched with route-aware document titles and descriptions.
- `low` — a Daraja callback could theoretically beat persistence of provider IDs, but the callback requires a later customer handset confirmation; rejected because the complex reconciliation fix is disproportionate to this negligible timing window.
- `low` — order-reference collision is technically possible but requires the same millisecond and matching random 16-bit suffix; rejected as negligible and already protected by the database uniqueness constraint.
- `medium` — empty, nonnumeric, or over-limit quantity input could create rejected totals; patched by integer normalization and 1–12 clamping.
- `medium` — repeated adds could exceed the backend limit; patched by clamping additions to 12.
- `medium` — valid non-array local-storage JSON could crash cart array operations; patched by validating and normalizing stored cart state.
- `low` — a successful empty catalog response rendered blank; patched with an explicit empty state and retry action.
- `low` — product loading briefly appeared as unavailable; patched with separate loading, error, and unavailable states.
- `medium` — failed payment offered no retry path; patched with an action that returns to the preserved checkout/cart flow.
- `medium` — checkout payload, failure preservation, and success navigation lacked tests; patched with focused Testing Library coverage.
- `medium` — order-status API fields, polling, receipt, and terminal states lacked tests; patched with backend route assertions and pending-to-paid/failed UI tests.
- `medium` — Daraja OAuth/STK payload and provider-error mapping lacked verification; patched with fake-client contract and safe-error tests.

## Design Notes

Use a warm editorial spirits aesthetic: bold serif display type paired with clean sans-serif body type, asymmetrical image-led sections, restrained gold rules, terracotta actions, subtle reveal/hover motion, generous whitespace, and tactile card surfaces. Commerce remains guest-first because the current single-product pickup model does not justify account friction.

## Verification

**Commands:**
- `npm run lint --prefix frontend` -- expected: no lint errors.
- `npm run test --prefix frontend -- --run` -- expected: frontend tests pass.
- `npm run build --prefix frontend` -- expected: production bundle builds.
- `npm test --prefix backend` -- expected: API and service tests pass.
- `npm run check:lines` -- expected: no authored source file exceeds 500 lines.

