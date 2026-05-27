# picode.md

Project guidance for PiCode. The authoritative project documentation is `CLAUDE.md` — read it first for architecture, conventions, and troubleshooting. This file contains a compact summary plus PiCode-specific notes.

## Project

**Claude Relay Service** — Node.js (>=18) middleware that relays requests to multiple upstream AI APIs (Claude official/Console, Gemini, OpenAI Responses, AWS Bedrock, Azure OpenAI, Droid, CCR). Provides multi-account management, API key auth, unified scheduling, proxy support, rate limiting, and cost tracking. Backend uses Express + Redis (ioredis); admin UI is a Vue 3 SPA in `web/admin-spa/`.

## Layout

```
src/
  app.js                  # entry point
  routes/                 # HTTP routes (api.js, admin/, *Routes.js, userRoutes.js, store.js, ...)
  middleware/             # auth.js, browserFallback.js
  handlers/               # request/response format adaptation
  services/
    relay/                # per-platform forwarding
    account/              # per-platform account management
    scheduler/            # unified account scheduler
    *Service.js           # apiKey, pricing, user, store, webhook, cost, ...
  models/redis.js         # all Redis access goes through here
  utils/                  # logger, proxy, oauth, cache, stream, tokenMask, ...
  validators/, cli/
config/                   # config.js, models.js, pricingSource.js
scripts/                  # ops/migration scripts
tests/                    # Jest tests (*.test.js / *.spec.js)
web/admin-spa/            # Vue 3 + Pinia + Element Plus + Tailwind
data/init.json            # admin credentials (created by `npm run setup`)
```

## Key flow

Client (`cr_`-prefixed key) → route → `auth` middleware (key + permission + rate limit + model blacklist) → unified scheduler (account selection / sticky session) → token refresh check → relay service (via proxy) → upstream → stream/non-stream response → usage capture → cost calc → client.

## Conventions (must follow)

- **Style**: no semicolons, single quotes, 100-col, no trailing comma, always parens on arrow fns. `const` enforced (`no-var`, `prefer-const`), strict equality (`eqeqeq`). `_`-prefixed unused vars are allowed.
- **Format before commit**: `npx prettier --write <file>`. Frontend has `prettier-plugin-tailwindcss`.
- **Security**:
  - Sensitive data (OAuth tokens, refresh tokens, credentials) must be AES-encrypted in Redis — pattern in `src/services/account/claudeAccountService.js`.
  - API keys stored as SHA-256 hash, never plaintext.
  - Never log full tokens — use `src/utils/tokenMask.js`.
  - All requests must traverse the full auth chain (key → permission → client limits → model blacklist).
  - On client disconnect, clean up via `AbortController` and decrement concurrency counters.
- **Layering**: routes do parameter extraction + response formatting only; business logic lives in services. All Redis access via `src/models/redis.js`.
- **Frontend**: Vue 3 Composition API, Pinia, Element Plus, Tailwind. All components must support dark mode (`dark:` prefix) and keep the existing glassmorphism style. Theme via `web/admin-spa/src/stores/theme.js`.

## Commands

```bash
npm install && npm run setup    # initialize (creates data/init.json)
npm run dev                     # nodemon hot reload (auto-lint)
npm start                       # production (lint then start)
npm run lint                    # ESLint --fix
npm run lint:check              # ESLint check only
npm run format                  # Prettier write
npm test                        # Jest
npm test -- <name>              # single test, e.g. npm test -- pricingService
npm run cli status              # service status
npm run install:web             # install SPA deps
npm run build:web               # build SPA → dist
cd web/admin-spa && npm run dev # SPA dev server (Vite HMR)
```

## Required env

`JWT_SECRET` (32+ chars), `ENCRYPTION_KEY` (exactly 32 chars), `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`. See `.env.example` for the rest.

## Workflow PiCode should follow

1. Read the relevant files before suggesting changes — match existing patterns and reuse services/utilities.
2. After editing JS, run `npx prettier --write <files>` then `npm run lint:check`.
3. After editing tests or touched modules, run `npm test -- <name>`.
4. Do not invent new abstractions when an existing service covers the case (check `src/services/` first).
5. For Redis schema or key changes, update/extend `src/models/redis.js`; do not access `ioredis` directly from services.
6. Treat `CLAUDE.md` troubleshooting table as the first reference for known failure modes (Redis, login, key prefix, token refresh, scheduler, sticky session, LDAP, webhook, cost stats).

## Current in-progress work (uncommitted, do not assume merged)

The working tree has WIP for a user-facing store/orders feature and user dashboard rework:

- New: `src/routes/store.js`, `src/routes/admin/orders.js`, `src/services/storeService.js`
- New SPA views: `StoreView.vue`, `StoreOrdersView.vue`, `UserRegisterView.vue`
- Modified: `src/app.js`, `src/routes/userRoutes.js`, `src/services/userService.js`, several SPA components/views, router, stores, http_apis

When touching these areas, read the current modified files first — `git status` reflects an active feature branch on `main`.
