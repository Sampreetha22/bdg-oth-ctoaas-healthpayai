# HealthPayAI — Local Run Instructions

This document explains how to run the HealthPayAI application locally (development and production modes), including starting a local PostgreSQL instance with Docker, setting required environment variables, and seeding synthetic data for development.

**Quick overview**
- The app serves both API and client from a single Express server on port `5000` by default.
- Development server command: `npm run dev` (uses `tsx` + Vite middleware).
- Production build: `npm run build` then `npm start` (serves the bundled server in `dist/index.js`).

**Prerequisites**
- Node.js (recommend v18+)
- npm (or pnpm/yarn) — instructions assume `npm`
- Docker (for running local Postgres)

**1) Start local Postgres (recommended)**
Run a Postgres container that the server can connect to:

```bash
docker run --name hpai-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=healthpay \
  -p 5432:5432 -d postgres:15
```

This creates a DB user `postgres` with password `postgres` and a database named `healthpay` on localhost:5432.

**2) Install dependencies**
From the project root:

```bash
npm install
```

**3) Set the `DATABASE_URL` environment variable**
The server requires `DATABASE_URL` to connect to Postgres. For the Docker setup above, use:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthpay"
```

You can also pass it inline when launching the server:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthpay" npm run dev
```

**4) Run the development server**

```bash
npm run dev
```

- The dev server uses Vite in middleware mode and serves the client + API on port `5000` by default.
- Open `http://localhost:5000` in your browser.

**5) (Optional) Seed synthetic data for development**
The repo includes a synthetic data generator at `server/data-generator.ts`. After you have a working `DATABASE_URL` and the DB is reachable, run:

```bash
# using npx/tsx (tsx is a devDependency)
npx tsx server/data-generator.ts
```

This will insert Providers, Members, Claims, EVV records, Clinical Outcomes, and Fraud Alerts into the database (can be large — the generator writes tens of thousands of rows). Monitor the terminal while it runs.

**6) Production build & run**

```bash
npm run build
# then (after build finishes)
npm start
```

This bundles the client (Vite build) and server (`esbuild`) and outputs a `dist/index.js` which `npm start` runs.

**Useful npm scripts (from `package.json`)**
- `npm run dev` — Run the app in development (Vite middleware + server)
- `npm run build` — Build client + bundle server to `dist`
- `npm start` — Run the production bundle (`NODE_ENV=production node dist/index.js`)
- `npm run check` — Typecheck with `tsc`
- `npm run db:push` — Run `drizzle-kit push` (migrations)

**Stopping / removing the local Postgres container**

```bash
# stop
docker stop hpai-postgres
# remove
docker rm hpai-postgres
```

**Troubleshooting**
- Error: `DATABASE_URL must be set` — You must export `DATABASE_URL` (see step 3).
- `compdef` messages when launching scripts — harmless zsh completion warnings, can be ignored.
- If the dev server doesn't appear to be running:
  - Verify `npm run dev` is running in your terminal and that `DATABASE_URL` is exported in that shell.
  - Confirm Postgres is running: `docker ps --filter name=hpai-postgres`.
  - Confirm port: the server binds to `0.0.0.0:5000`; verify with `curl -I http://localhost:5000`.

**Where things live in the repo**
- Client source: `client/src/`
- Server code: `server/` (entry points: `server/index-dev.ts` for dev, `server/index-prod.ts` for build)
- DB code: `server/db.ts` and `shared/schema.ts` (Drizzle schema)
- Data generator: `server/data-generator.ts`

**Optional: Run without a DB (not recommended)**
The app expects a Postgres connection and many features rely on it. Running without a DB requires code changes to stub `storage`/`db` modules — if you need a quick UI-only preview, tell me and I can add a minimal `--no-db` mode that skips DB initialization and serves static demo data.

If you want, I can also:
- Add a `Makefile` or `dev` script to start Docker + run the dev server in one command.
- Add a short script to stop/remove the Docker container and clear DB data.

---
If you want, I can commit this `README.md` into the repo (done here) and also add a `scripts/dev.sh` helper to start Postgres + the dev server together. Which helper would you like next?
