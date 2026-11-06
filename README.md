# Mercada Impex

Modern React storefront and modular Express/MongoDB API for Mercada Impex. The storefront preserves the established brand, Johari Gin at KES 5,390, authenticated M-Pesa checkout, private customer order history, and pickup at Oro Restaurant & Lounge, Kilimani.

## Local setup

1. Install with `npm install --prefix frontend` and `npm install --prefix backend`.
2. Copy `backend/.env.example` to `backend/.env` and provide MongoDB, Daraja, and optional SMTP values. Copy `frontend/.env.example` to `frontend/.env` only when the API is hosted separately.
3. Start the API with `npm run dev --prefix backend`. It idempotently provisions Johari after MongoDB connects.
4. Start Vite with `npm run dev --prefix frontend`; its `/api/v1` proxy targets `http://localhost:5000`.

The API refuses to start without `MONGODB_URI` or if catalog provisioning fails. Checkout requires a customer account and all Daraja variables; it never fabricates payment success. Sessions use revocable, hashed opaque tokens in HTTP-only cookies. `MPESA_CALLBACK_URL` must be a public HTTPS URL ending in `/api/v1/payments/callback`. SMTP is optional.

## Verification

Run `npm run lint --prefix frontend`, `npm run test --prefix frontend -- --run`, `npm run build --prefix frontend`, `npm test --prefix backend`, and `npm run check:lines`.

## Deployment boundaries

Serve `frontend/dist` from a static host and route `/api/v1` to the backend, or set `VITE_API_URL` to the HTTPS backend origin at build time. `FRONTEND_ORIGIN` accepts a comma-separated allowlist (for example, `https://shop.example.com,https://www.example.com`). Because session cookies use `SameSite=Lax`, deploy the frontend and API on the same site or use a same-origin `/api/v1` rewrite; production cookies also require HTTPS. Keep `.env` files and credentials out of source control. MongoDB is the system of record for products, customers, sessions, contacts, orders, and payment state. Legacy guest orders remain unclaimed and excluded from customer histories; admin tools, password reset, and email verification remain out of scope.
