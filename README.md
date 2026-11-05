# Mercada Impex

Modern React storefront and modular Express/MongoDB API for Mercada Impex. The storefront preserves the established brand, Johari Gin at KES 5,390, M-Pesa guest checkout, and pickup at Oro Restaurant & Lounge, Kilimani.

## Local setup

1. Install with `npm install --prefix frontend` and `npm install --prefix backend`.
2. Copy `backend/.env.example` to `backend/.env` and provide MongoDB, Daraja, and optional SMTP values. Copy `frontend/.env.example` to `frontend/.env` only when the API is hosted separately; same-origin `/api/v1` is the production default.
3. Seed Johari with `npm run seed --prefix backend`.
4. Start the API with `npm run dev --prefix backend` and Vite with `npm run dev --prefix frontend`.

The API refuses to start without `MONGODB_URI`. Checkout remains unavailable until all Daraja variables are present; it never fabricates payment success. `MPESA_CALLBACK_URL` must be a public HTTPS URL ending in `/api/v1/payments/callback`. SMTP is optional; submitted contacts are always persisted before mail is attempted.

## Verification

Run `npm run lint --prefix frontend`, `npm run test --prefix frontend -- --run`, `npm run build --prefix frontend`, `npm test --prefix backend`, and `npm run check:lines`.

## Deployment boundaries

Serve `frontend/dist` from a static host and route `/api/v1` to the backend, or set `VITE_API_URL` at build time. Keep `.env` files and credentials out of source control. MongoDB is the system of record for products, contacts, orders, and payment state; use a managed production database and HTTPS. The application includes guest commerce only—customer accounts and an admin dashboard are intentionally out of scope.
