## Context

The project follows Clean Architecture principles but the directory layout has not kept pace as the codebase grew. Key structural issues:

- **40+ util files** in a flat `src/utils/` with no logical grouping
- **Monolithic service files**: `claudeAccountService.js` (3617 lines), `claudeRelayService.js` (3721 lines), `anthropicGeminiBridgeService.js` (3291 lines), `unifiedClaudeScheduler.js` (1962 lines)
- **Mixed service organization**: `account/`, `relay/`, `scheduler/` subdirectories exist, but ~30 services sit directly in `src/services/`
- **Deep relative paths**: `require('../../../../config/config')` throughout, making moves fragile
- **`app.js` initialization bloat**: startup logic mixed with Express app configuration (1000+ lines)

All changes are structural only — zero runtime behavior change, zero API change, zero config change.

## Goals / Non-Goals

**Goals:**
- Reduce directory flatness: no directory with more than ~15 files at the top level
- Break files >1500 lines into focused modules (target: <800 lines per file)
- Group services by domain into subdirectories
- Extract `app.js` initialization into a dedicated bootstrap module
- Eliminate deep relative paths with barrel exports (no tooling/compilation required)
- Provide generic admin CRUD helpers to reduce route boilerplate
- Keep every existing test passing throughout the migration

**Non-Goals:**
- Changing class APIs, function signatures, or runtime behavior
- Introducing TypeScript or compilation steps
- Changing the Express/Node.js framework setup
- Re-architecting the Clean Architecture layers themselves
- Adding new features or fixing bugs
- Changing dependency injection patterns (the codebase uses manual require DI, and we keep it)

## Decisions

### Decision 1: Utils reorganization — domain-based subdirectories

**Chosen**: Group 40+ util files into 8 domain-based subdirectories under `src/utils/`:

```
src/utils/
├── logging/          # logger.js, tokenRefreshLogger.js, safeRotatingAppend.js
├── http/             # proxyHelper.js, headerFilter.js, streamHelper.js, sseParser.js
├── security/         # tokenMask.js, errorSanitizer.js, inputValidator.js
├── cache/            # lruCache.js, cacheMonitor.js, signatureCache.js
├── request/          # costCalculator.js, contents.js, sessionHelper.js,
│                       statsHelper.js, requestDetailHelper.js, metadataUserIdHelper.js,
│                       rateLimitHelper.js, warmupInterceptor.js
├── upstream/         # upstreamErrorHelper.js, tempUnavailablePolicy.js,
│                       unstableUpstreamHelper.js, performanceOptimizer.js
├── diagnostics/      # anthropicRequestDump.js, anthropicResponseDump.js,
│                       antigravityUpstreamDump.js, antigravityUpstreamResponseDump.js
├── oauth/            # oauthHelper.js, workosOAuthHelper.js, antigravityModel.js
└── common/           # commonHelper.js, dateHelper.js, modelHelper.js,
                        projectPaths.js, featureFlags.js, runtimeAddon.js,
                        geminiSchemaCleaner.js, testPayloadHelper.js,
                        webhookNotifier.js
```

Each subdirectory gets a barrel `index.js` that re-exports all modules, enabling:
```js
// Before
const { maskToken } = require('../../utils/tokenMask')
const logger = require('../../utils/logger')
// After
const { maskToken, logger } = require('../../utils')
```

**Alternatives considered:**
- **Functional grouping (crypto, io, data, etc.)**: Too abstract; domain grouping maps naturally to how the codebase uses these modules
- **Keep flat, just add jsdoc tags**: Doesn't solve navigability; 40 files in one directory is overwhelming

### Decision 2: Service decomposition — extract by concern, not by line count

**Chosen**: Decompose monolithic services by extracting independent concerns into co-located modules. Use a "main class + concern modules" pattern:

```
src/services/account/claude/
├── index.js                    # Re-exports ClaudeAccountService
├── ClaudeAccountService.js     # Main class (orchestration, < 800 lines)
├── tokenManager.js             # Token lifecycle (refresh, rotation, usage tracking)
├── oauthClient.js              # OAuth token exchange with upstream
├── subscriptionService.js      # Pro/Max subscription checking, rate limits
├── sessionManager.js           # Session window management
├── accountSerializer.js        # Encryption/decryption of stored credentials
└── crypto.js                   # AES encrypt/decrypt helpers
```

Each concern module exports plain functions. The main class requires them and delegates.

**Rule**: Extract when extraction removes ≥200 lines from the main file and the concern has a clear name. Don't split just to split — a 400-line file with a single clear concern stays as-is.

**Scope**: Only files >1500 lines are decomposed. Smaller files keep their current structure.

Files to decompose:
| File | Lines | Split into |
|------|-------|------------|
| `claudeRelayService.js` | 3721 | requestBuilder, responseProcessor, streamHandler, errorHandler |
| `claudeAccountService.js` | 3617 | tokenManager, oauthClient, subscriptionService, sessionManager, accountSerializer, crypto |
| `anthropicGeminiBridgeService.js` | 3291 | requestTransformer, responseTransformer, toolUseMapper, contentConverter |
| `unifiedClaudeScheduler.js` | 1962 | accountSelector, stickySession, concurrencyManager |
| `geminiAccountService.js` | 1989 | tokenManager, accountSerializer |
| `claudeConsoleAccountService.js` | 1705 | tokenManager, accountSerializer |
| `droidAccountService.js` | 1627 | tokenManager, accountSerializer |
| `droidRelayService.js` | 1618 | requestBuilder, responseProcessor |
| `claudeConsoleRelayService.js` | 1576 | requestBuilder, responseProcessor |

**Alternatives considered:**
- **Subclass inheritance**: Adds complexity; composition with plain functions is simpler and more testable
- **One file per method (extreme split)**: Creates too many files, navigation fatigue

### Decision 3: Top-level services — group by domain

**Chosen**: Move ~30 services currently in `src/services/` into subdirectories:

```
src/services/
├── account/           # (existing) — per-platform account services
├── relay/             # (existing) — per-platform relay services
├── scheduler/         # (existing) — unified schedulers
├── balanceProviders/  # (existing) — balance checking providers
├── auth/              # apiKeyService.js, apiKeyIndexService.js, ldapService.js,
│                      #   userService.js, userMessageQueueService.js
├── billing/           # pricingService.js, costInitService.js, costRankService.js,
│                      #   weeklyClaudeCostInitService.js, serviceRatesService.js,
│                      #   quotaCardService.js, billingEventPublisher.js
├── notification/      # webhookService.js, webhookConfigService.js
├── transform/         # openaiToClaude.js, codexToOpenAI.js, geminiToOpenAI.js,
│                      #   anthropicGeminiBridgeService.js (decomposed)
├── routing/           # claudeRelayConfigService.js, requestBodyRuleService.js,
│                      #   requestIdentityService.js, requestDetailService.js,
│                      #   modelService.js, accountNameCacheService.js
├── referral/          # referralService.js
├── store/             # storeService.js
├── accountGroupService.js     # stays at top (cross-cutting account concern)
├── accountTestSchedulerService.js  # stays at top (cross-cutting)
├── antigravityClient.js       # stays at top (standalone client)
├── balanceScriptService.js    # stays at top (standalone)
├── claudeCodeHeadersService.js # stays at top (standalone)
├── rateLimitCleanupService.js  # stays at top (standalone)
└── tokenRefreshService.js     # stays at top (cross-cutting)
```

Files under ~200 lines with clear domain affinity move into subdirectories. Standalone services that don't fit any group stay at top level.

**Alternatives considered:**
- **Every service in a subdirectory**: Over-engineering; a few standalone services at the top level is fine

### Decision 4: `src/lib/` for pure utilities

**Chosen**: Introduce `src/lib/` for utility functions with zero internal dependencies (no `require` of other project files except standard library). Move eligible files:

```
src/lib/
├── crypto.js        # from utils/ — pure crypto operations (extracted from oauthHelper + account services)
├── formatters.js    # date formatting, byte formatting (extracted from commonHelper)
├── validators.js    # input validation helpers (extracted from inputValidator)
└── constants.js     # shared constants (extracted from various files)
```

This distinction helps with reasoning: `lib/` modules can be tested in isolation with no mocking.

**Alternatives considered:**
- **Keep everything in utils/**: Blurs the line between service-aware helpers and pure functions

### Decision 5: Bootstrap extraction

**Chosen**: Extract `app.js` initialization logic into `src/bootstrap/`:

```
src/
├── app.js            # ~200 lines: Express app class, middleware wiring, route mounting
├── bootstrap/
│   ├── index.js      # Orchestrates startup sequence
│   ├── redis.js      # Redis connection + migration checks
│   ├── services.js   # Service initialization (pricing, model, cost, etc.)
│   └── admin.js      # Admin credential setup, session cleanup
```

**Alternatives considered:**
- **Single `init.js` file**: Just moves the problem to another monolithic file

### Decision 6: Admin route consolidation

**Chosen**: Create a generic CRUD route factory at `src/routes/admin/routeFactory.js`:

```js
// Before: Each admin route file is a full Express router with boilerplate
// After: Define the service shape, factory generates the routes

const { createCrudRoutes } = require('./routeFactory')

const router = createCrudRoutes({
  prefix: '/api/admin/claude-accounts',
  service: claudeAccountService,
  fields: ['id', 'email', 'status', 'accountType', ...],
  listMethod: 'getAllAccounts',
  getMethod: 'getAccount',
  createMethod: 'createAccount',
  updateMethod: 'updateAccount',
  deleteMethod: 'deleteAccount'
})

module.exports = router
```

The factory handles: auth middleware, parameter validation, error formatting, pagination, and webhook notifications. Routes with unique logic (dashboard, sync, system) keep custom implementations.

**Scope**: Apply to account-type routes only (12 account types × ~150 lines each = ~1800 lines reduced). Admin routes with non-CRUD behavior (dashboard, sync, system, concurrency, balance scripts) keep custom implementations.

### Decision 7: Import resolution — barrel exports only

**Chosen**: Use barrel `index.js` files in each subdirectory only. No tooling changes (no `require.resolve` hacks, no `NODE_PATH` manipulation, no build step).

This means:
```js
// Services import utils through a single path
const { logger, maskToken, proxyHelper } = require('../utils')
// Instead of
const logger = require('../utils/logger')
const { maskToken } = require('../utils/tokenMask')
const ProxyHelper = require('../utils/proxyHelper')
```

The barrel files are explicit re-exports, keeping `require` resolution simple and IDE-friendly.

**Alternatives considered:**
- **`NODE_PATH=src` to eliminate relative paths**: Requires env changes to all deployment configs, breaks some tooling
- **`link-module-alias` or `module-alias` npm package**: Adds dependency, makes `require` resolution opaque
- **Subpath imports (`#utils/logger`)**: Requires Node 18+, not universally available

### Decision 8: Migration approach — incremental with backward compat

**Chosen**: Multi-phase migration where each phase is a standalone commit that keeps tests green:

1. Create new directories and barrel exports
2. Move files one subdirectory at a time, updating internal requires
3. Decompose monolithic files one at a time
4. Extract bootstrap from app.js
5. Consolidate admin routes
6. Remove old paths, final cleanup

Each phase produces a passing test suite and deployable state. No "big bang" switchover.

## Risks / Trade-offs

- **Git blame disruption**: Moving files resets blame history → Mitigation: `git blame --follow` tracks moves; communicate clearly in commit messages
- **Merge conflicts with ongoing branches**: Renames conflict with any branch touching moved files → Mitigation: coordinate with team, schedule during low-change window
- **Circular dependency risk with barrel exports**: Barrel files that import from each other cause `require` loops → Mitigation: barrels only export, never import from sibling barrels; lint rule to enforce
- **Decomposition introduces more require calls**: More files = more `require()` overhead → Mitigation: Node.js caches `require` results, so startup cost is negligible
- **Admin route factory may not fit all cases**: Push too many routes through the factory → Mitigation: factory is opt-in; only 12 account-type CRUD routes use it; non-standard routes stay custom

## Migration Plan

1. **Phase 1**: Create `src/lib/` and `src/bootstrap/` directories (no moves yet)
2. **Phase 2**: Add barrel exports to `src/utils/` subdirectories; all existing paths still work
3. **Phase 3**: Move services into domain subdirectories; update internal requires; keep old paths via proxy files
4. **Phase 4**: Decompose monolithic services (one service per PR)
5. **Phase 5**: Extract bootstrap from `app.js`
6. **Phase 6**: Implement admin route factory; migrate account routes
7. **Phase 7**: Remove deprecated proxy files; update all requires to canonical paths

Each phase: run full test suite (`npm test`), lint (`npm run lint`), and verify `npm start`.

Rollback: Each phase is independently revertible via `git revert`. No data migrations involved.

## Open Questions

- **Timing**: Should this happen before or after any pending feature branches merge?
- **Review strategy**: Full review of the entire restructure at once, or per-phase review?
- **Decomposition depth**: Is the "800 lines target" appropriate, or should it be stricter (500 lines)?
