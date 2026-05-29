## 1. Setup — Create new directories

- [x] 1.1 Create `src/lib/` directory structure with `crypto.js`, `formatters.js`, `validators.js`, `constants.js` (extract pure functions with no internal dependencies)
- [x] 1.2 Create `src/bootstrap/` directory with `index.js` (shell), `redis.js` (shell), `services.js` (shell), `admin.js` (shell)

## 2. Utils — Reorganize into subdirectories with barrel exports

- [x] 2.1 Create 9 utils subdirectories: `logging/`, `http/`, `security/`, `cache/`, `request/`, `upstream/`, `diagnostics/`, `oauth/`, `common/`
- [x] 2.2 Move `logger.js`, `tokenRefreshLogger.js`, `safeRotatingAppend.js` into `src/utils/logging/`; create barrel `index.js`
- [x] 2.3 Move `proxyHelper.js`, `headerFilter.js`, `streamHelper.js`, `sseParser.js` into `src/utils/http/`; create barrel `index.js`
- [x] 2.4 Move `tokenMask.js`, `errorSanitizer.js`, `inputValidator.js` into `src/utils/security/`; create barrel `index.js`
- [x] 2.5 Move `lruCache.js`, `cacheMonitor.js`, `signatureCache.js` into `src/utils/cache/`; create barrel `index.js`
- [x] 2.6 Move `costCalculator.js`, `contents.js`, `sessionHelper.js`, `statsHelper.js`, `requestDetailHelper.js`, `metadataUserIdHelper.js`, `rateLimitHelper.js`, `warmupInterceptor.js` into `src/utils/request/`; create barrel `index.js`
- [x] 2.7 Move `upstreamErrorHelper.js`, `tempUnavailablePolicy.js`, `unstableUpstreamHelper.js`, `performanceOptimizer.js` into `src/utils/upstream/`; create barrel `index.js`
- [x] 2.8 Move `anthropicRequestDump.js`, `anthropicResponseDump.js`, `antigravityUpstreamDump.js`, `antigravityUpstreamResponseDump.js` into `src/utils/diagnostics/`; create barrel `index.js`
- [x] 2.9 Move `oauthHelper.js`, `workosOAuthHelper.js`, `antigravityModel.js` into `src/utils/oauth/`; create barrel `index.js`
- [x] 2.10 Move remaining utils (`commonHelper.js`, `dateHelper.js`, `modelHelper.js`, `projectPaths.js`, `featureFlags.js`, `runtimeAddon.js`, `geminiSchemaCleaner.js`, `testPayloadHelper.js`, `webhookNotifier.js`) into `src/utils/common/`; create barrel `index.js`
- [x] 2.11 Create `src/utils/index.js` top-level barrel that re-exports from all 9 sub-barrels
- [x] 2.12 Update all internal `require()` paths across the codebase to use new util subdirectory paths
- [x] 2.13 Create proxy files at old util locations that re-export from new canonical paths (for backward compat during migration)
- [x] 2.14 Run `npm test` and `npm run lint` to verify no breakage

## 3. Services — Reorganize top-level services into domain subdirectories

- [x] 3.1 Create `src/services/auth/` directory; move `apiKeyService.js`, `apiKeyIndexService.js`, `ldapService.js`, `userService.js`, `userMessageQueueService.js`; create barrel `index.js`
- [x] 3.2 Create `src/services/billing/` directory; move `pricingService.js`, `costInitService.js`, `costRankService.js`, `weeklyClaudeCostInitService.js`, `serviceRatesService.js`, `quotaCardService.js`, `billingEventPublisher.js`; create barrel `index.js`
- [x] 3.3 Create `src/services/notification/` directory; move `webhookService.js`, `webhookConfigService.js`; create barrel `index.js`
- [x] 3.4 Create `src/services/transform/` directory; move `openaiToClaude.js`, `codexToOpenAI.js`, `geminiToOpenAI.js`, `anthropicGeminiBridgeService.js`; create barrel `index.js`
- [x] 3.5 Create `src/services/routing/` directory; move `claudeRelayConfigService.js`, `requestBodyRuleService.js`, `requestIdentityService.js`, `requestDetailService.js`, `modelService.js`, `accountNameCacheService.js`; create barrel `index.js`
- [x] 3.6 Create `src/services/referral/` directory; move `referralService.js`; create barrel `index.js`
- [x] 3.7 Create `src/services/store/` directory; move `storeService.js`; create barrel `index.js`
- [x] 3.8 Create `src/services/index.js` top-level barrel that re-exports from all domain subdirectories
- [x] 3.9 Update all internal `require()` paths across the codebase to use new service subdirectory paths
- [x] 3.10 Create proxy files at old service locations for backward compat
- [x] 3.11 Run `npm test` and `npm run lint` to verify no breakage

## 4. Service Decomposition — Break down monolithic files

- [x] 4.1 Decompose `claudeAccountService.js` into `src/services/account/claude/` directory: main class + `tokenManager.js`, `oauthClient.js`, `subscriptionService.js`, `sessionManager.js`, `accountSerializer.js`, `crypto.js`
- [x] 4.2 Decompose `claudeRelayService.js` into `src/services/relay/claude/` directory: main class + `requestBuilder.js`, `responseProcessor.js`, `streamHandler.js`, `errorHandler.js`
- [x] 4.3 Decompose `anthropicGeminiBridgeService.js` into `src/services/transform/anthropicGemini/` directory: main class + `requestTransformer.js`, `responseTransformer.js`, `toolUseMapper.js`, `contentConverter.js`
- [x] 4.4 Decompose `unifiedClaudeScheduler.js` into `src/services/scheduler/claude/` directory: main class + `accountSelector.js`, `stickySession.js`, `concurrencyManager.js`
- [x] 4.5 Decompose `geminiAccountService.js` (1989 lines) into `src/services/account/gemini/`: main class + `tokenManager.js`, `accountSerializer.js`
- [x] 4.6 Decompose `droidAccountService.js` (1627 lines) into `src/services/account/droid/`: main class + `tokenManager.js`, `accountSerializer.js`
- [x] 4.7 Decompose `claudeConsoleAccountService.js` (1705 lines) into `src/services/account/claudeConsole/`: main class + `tokenManager.js`, `accountSerializer.js`
- [x] 4.8 Decompose `droidRelayService.js` (1618 lines) into `src/services/relay/droid/`: main class + `requestBuilder.js`, `responseProcessor.js`
- [x] 4.9 Decompose `claudeConsoleRelayService.js` (1576 lines) into `src/services/relay/claudeConsole/`: main class + `requestBuilder.js`, `responseProcessor.js`
- [x] 4.10 Update all require paths to point to decomposed service directories; create proxy files at old paths
- [x] 4.11 Run `npm test` and `npm run lint` after each decomposition to verify no breakage

## 5. Bootstrap — Extract initialization from app.js

- [x] 5.1 Extract Redis initialization logic from `app.js` into `src/bootstrap/redis.js` (connect, migration checks, index maintenance)
- [x] 5.2 Extract service initialization from `app.js` into `src/bootstrap/services.js` (pricing, model, cost data, session windows, cost rank, API key index, account groups)
- [x] 5.3 Extract admin setup from `app.js` into `src/bootstrap/admin.js` (credential init, session cleanup)
- [x] 5.4 Implement `src/bootstrap/index.js` orchestrator that calls redis → services → admin in order
- [x] 5.5 Refactor `src/app.js` `Application.initialize()` to delegate to bootstrap module
- [x] 5.6 Verify `src/app.js` is under 300 lines after extraction
- [x] 5.7 Run `npm test`, `npm run lint`, and `npm start` to verify

## 6. Admin Routes — Consolidate with route factory

- [ ] 6.1 Create `src/routes/admin/routeFactory.js` with `createCrudRoutes()` function supporting: list, get, create, update, delete operations
- [ ] 6.2 Migrate `claudeAccounts.js` to use route factory
- [ ] 6.3 Migrate `claudeConsoleAccounts.js` to use route factory
- [ ] 6.4 Migrate `geminiAccounts.js` to use route factory
- [ ] 6.5 Migrate `geminiApiAccounts.js` to use route factory
- [ ] 6.6 Migrate `openaiAccounts.js` to use route factory
- [ ] 6.7 Migrate `openaiResponsesAccounts.js` to use route factory
- [ ] 6.8 Migrate `azureOpenaiAccounts.js` to use route factory
- [ ] 6.9 Migrate `bedrockAccounts.js` to use route factory
- [ ] 6.10 Migrate `ccrAccounts.js` to use route factory
- [ ] 6.11 Migrate `droidAccounts.js` to use route factory
- [ ] 6.12 Verify non-CRUD admin routes (dashboard, system, sync, concurrency, balance scripts, claudeRelayConfig, store, referral, orders, quotaCards, serviceRates, requestDetails, errorHistory) remain custom
- [ ] 6.13 Run `npm test` and `npm run lint` to verify

## 7. Final Cleanup

- [x] 7.1 Remove all deprecated proxy files from old util locations (phase 2.13)
- [x] 7.2 Remove all deprecated proxy files from old service locations (phase 3.10)
- [x] 7.3 Remove old proxy files from decomposed service locations (phase 4.10)
- [x] 7.4 Update `tests/` directory import paths to canonical new locations
- [x] 7.5 Update `CLAUDE.md` project structure documentation to reflect new layout
- [x] 7.6 Run full validation: `npm run lint && npm test && npm start` to verify everything works end-to-end
