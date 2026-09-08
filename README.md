# Your Cart UI

[![UI tests](https://github.com/tarun572/Your_Cart_UI/actions/workflows/test.yml/badge.svg)](https://github.com/tarun572/Your_Cart_UI/actions/workflows/test.yml)
[![Code coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/tarun572/Your_Cart_UI/main/coverage-badge.json)](https://github.com/tarun572/Your_Cart_UI/actions/workflows/test.yml)

React and TypeScript frontend for the Your Cart shopping application.

## Requirements

- Node.js
- The shopping server running on `http://localhost:3001`

## Install and run

```bash
npm install
npm run dev
```

The Vite development server will print the local URL when it starts.

## Seller registration and email

Seller registration is sent to the server's `/registration-api` route. The server generates the seller's unique `user_key` and sends it to the registered email automatically. The UI does not call a separate email endpoint.

The seller uses that key on the login page to access seller features and manage products.

## Other commands

```bash
npm run build
npm run lint
npm run preview
```

The API base URL is currently defined in `src/api.ts` as `http://localhost:3001`.

## Tests

UI tests are kept in the root `tests/` folder and cover session persistence, Redux auth/cart/product state, and mock API behavior.

```bash
npm test -- --coverage
```

The UI Jest configuration enforces at least 95% statements, branches, functions, and lines across `mockApi.ts`, `sessionManager.ts`, and `store.ts`.

GitHub Actions publishes the coverage table in the workflow summary, adds or updates a coverage comment on pull requests, and uploads the full `coverage/` directory as an artifact for runs on `main` or `master`.

For deployment, create a `.env` file from `.env.example` and set:

```env
VITE_API_URL=https://your-backend-domain.com
```

Vite exposes `VITE_*` values to the browser, so do not put secrets in the UI environment file.
