# GameVault Frontend

Quasar 2 + Vue 3 + TypeScript frontend for the GameVault API.

## Run locally

Start the backend first:

```powershell
cd ..\backend
npm run dev
```

Then start the Quasar app:

```powershell
cd ..\frontend
npm run dev
```

Open `http://localhost:9000`.

Create an account or sign in from the GameVault page. Library and wishlist
routes require an account. Wishlist prices are saved as numeric amounts and
shown without a currency symbol because this app does not define a currency.

## Commands

- `npm run dev` starts the Quasar development server.
- `npm run typecheck` checks Vue and TypeScript types.
- `npm run build` creates the production SPA in `dist/spa`.

The API defaults to `http://localhost:3000/api`. Set `VITE_API_URL` in a `.env` file when using another API URL.
