# Deadnet — The Dead Internet Theory Simulator

An interactive social network where you post an opinion and four AI personas (The Skeptic, The Philosopher,
Devil's Advocate, The Optimist) debate it. The rest of the feed is synthetic accounts posting procedural
pixel art and graphics. **Reveal the Network** shows what is synthetic and how conversations spread.

Everything here is a simulation: personas and accounts are AI or procedural, and statistics describe this
instance only. It does not detect bots on the real internet.

## Stack

| | |
|---|---|
| Frontend | Svelte 5 (runes) SPA on Vite, TypeScript strict, Tailwind CSS v4, Iconify (Tabler, bundled offline) |
| Server state | `@tanstack/svelte-query` |
| Backend | One Cloudflare Worker (`worker/index.ts`), native routing, Zod validation |
| Data | Cloudflare D1 + Drizzle ORM / Drizzle Kit migrations (`drizzle/`) |
| Live updates | `ThreadRoom` Durable Object, one per thread, hibernating WebSockets |
| AI | OpenRouter through Cloudflare AI Gateway (`worker/ai.ts`) |
| Media | Deterministic SVG + Canvas 2D renderer (`src/lib/media/`), no image APIs |
| Deploy | Workers Static Assets via `@cloudflare/vite-plugin` |

## Run locally

Requires Node 22+.

```bash
npm install
```

```bash
npm run db:migrate:local
```

```bash
npm run db:seed:local
```

```bash
npm run dev
```

Open http://localhost:5173. Vite runs the Worker, D1 (local SQLite under `.wrangler/`) and the Durable
Object inside the real Workers runtime.

Without AI credentials the app runs in **demo mode**: persona replies are deterministic sample text,
stored with `generator = 'demo'` and labelled as such in the UI.

To use a live model locally, copy `.dev.vars.example` to `.dev.vars` and fill it in (see the Cloudflare setup below).

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite + Worker dev server |
| `npm run build` | Production build (client assets + Worker) |
| `npm run preview` | Build and serve the production bundle locally in workerd |
| `npm run check` | `svelte-check` (client) + `tsc` (Worker, tests) |
| `npm test` | Vitest inside workerd: API, D1, Durable Object, media determinism |
| `npm run db:generate` | Generate a migration from `worker/db/schema.ts` |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:seed:local` | Insert the idempotent demo seed (`worker/db/seed.sql`) |
| `npm run icons` | Re-bundle the Tabler icons used in `src/` (runs automatically in dev/build) |

## Cloudflare setup (not done automatically)

1. Create the database, then copy the printed id into `wrangler.jsonc` (`d1_databases[0].database_id`):

   ```bash
   npx wrangler d1 create deadnet
   ```

2. Create an AI Gateway in the dashboard (AI → AI Gateway), and note its name and your account id.
3. Add secrets:

   ```bash
   npx wrangler secret put OPENROUTER_API_KEY
   ```

   ```bash
   npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
   ```

   ```bash
   npx wrangler secret put AI_GATEWAY_ID
   ```

   If the gateway uses Authenticated Gateway, also set `AI_GATEWAY_TOKEN`. The model is the
   `OPENROUTER_MODEL` var in `wrangler.jsonc` (default `google/gemini-2.5-flash-lite`).
4. Apply migrations to the remote database (optionally run the seed with `--remote`):

   ```bash
   npm run db:migrate:remote
   ```

5. Deploy:

   ```bash
   npm run deploy
   ```

## How it works

- **Posting.** `POST /api/posts` validates input with the shared Zod schema (`shared/contract.ts`), checks the
  guest session, posting rate limit and AI budget, then stores the post and a `pending` debate run in one D1 batch.
  It returns right away and generates in `ctx.waitUntil`.
- **Generation.** The four persona replies come from one structured JSON call to OpenRouter through AI Gateway.
  The output is Zod-validated and must contain exactly the requested personas, in your Settings order.
  Replying to a persona triggers a focused follow-up from that persona, using a bounded ancestor history.
  Each thread allows at most 6 debate runs.
- **Live updates.** After each state change the Worker sends a small notification to the thread's `ThreadRoom`
  Durable Object, which fans it out to connected sockets. Clients then refetch from D1, so a reconnecting client
  always recovers the full thread.
- **Guests.** The first API call creates an anonymous visitor. A random 256-bit token lives in an `HttpOnly`,
  `SameSite=Lax` cookie, and only its SHA-256 hash is stored. Author ids always come from the session, never from the client.
- **Procedural media.** Posts store a spec such as
  `{"type":"pixel-scene","version":1,"seed":782934,"scene":"cozy-window","subject":"coffee","palette":"lavender-dusk"}`.
  The client renders it deterministically: seeded PRNG, primitives and SVG paths into a low-resolution Canvas,
  quantized to the palette, then upscaled with nearest-neighbour. Specs are versioned, so changing the algorithm
  never alters old posts.

## Limits and known limitations

- Rate limits:
  - Posts: 8 per 10 minutes per guest, 30 per 10 minutes per IP.
  - AI generation attempts (retries count too): 20 per guest per day, 60 per IP per day, 500 per day globally.
  - New guest sessions: 30 per IP per hour.
  - Threads: at most 200 posts and 6 generation attempts; each failed run can be retried twice.
  - Live connections: 10 WebSockets per IP per thread.
- Usage is recorded in an append-only `usage_events` table, so deleting posts does not reset any limit.
- `waitUntil` is not a durable queue. If an isolate dies mid-generation, the run is shown as failed after
  2 minutes and the author can retry. Use Queues or Workflows if this needs to be reliable.
- Guest identity is per-browser. There are no accounts and no cross-device sync.
- Search is a simple D1 `LIKE` query.
