# Your Cart UI

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
