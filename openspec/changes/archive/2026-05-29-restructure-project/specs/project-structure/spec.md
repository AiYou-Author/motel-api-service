## ADDED Requirements

### Requirement: Utils directory is organized by domain

`src/utils/` SHALL be organized into subdirectories grouped by domain, with each subdirectory containing a barrel `index.js` that re-exports all modules within it.

#### Scenario: Logging utilities are grouped
- **WHEN** a developer looks for logging-related utilities
- **THEN** all logging modules (logger, tokenRefreshLogger, safeRotatingAppend) SHALL be found in `src/utils/logging/`

#### Scenario: HTTP utilities are grouped
- **WHEN** a developer looks for HTTP/proxy utilities
- **THEN** all HTTP modules (proxyHelper, headerFilter, streamHelper, sseParser) SHALL be found in `src/utils/http/`

#### Scenario: Security utilities are grouped
- **WHEN** a developer looks for security utilities
- **THEN** all security modules (tokenMask, errorSanitizer, inputValidator) SHALL be found in `src/utils/security/`

#### Scenario: Cache-related utilities are grouped
- **WHEN** a developer looks for cache utilities
- **THEN** all cache modules (lruCache, cacheMonitor, signatureCache) SHALL be found in `src/utils/cache/`

#### Scenario: Request processing utilities are grouped
- **WHEN** a developer looks for request-processing utilities
- **THEN** all request modules (costCalculator, contents, sessionHelper, statsHelper, requestDetailHelper, metadataUserIdHelper, rateLimitHelper, warmupInterceptor) SHALL be found in `src/utils/request/`

#### Scenario: Upstream interaction utilities are grouped
- **WHEN** a developer looks for upstream-related utilities
- **THEN** all upstream modules (upstreamErrorHelper, tempUnavailablePolicy, unstableUpstreamHelper, performanceOptimizer) SHALL be found in `src/utils/upstream/`

#### Scenario: Diagnostics utilities are grouped
- **WHEN** a developer looks for diagnostics/dump utilities
- **THEN** all diagnostic modules (anthropicRequestDump, anthropicResponseDump, antigravityUpstreamDump, antigravityUpstreamResponseDump) SHALL be found in `src/utils/diagnostics/`

#### Scenario: OAuth utilities are grouped
- **WHEN** a developer looks for OAuth utilities
- **THEN** all OAuth modules (oauthHelper, workosOAuthHelper, antigravityModel) SHALL be found in `src/utils/oauth/`

#### Scenario: Common utilities are grouped
- **WHEN** a developer looks for general-purpose helpers
- **THEN** all common modules (commonHelper, dateHelper, modelHelper, projectPaths, featureFlags, runtimeAddon, geminiSchemaCleaner, testPayloadHelper, webhookNotifier) SHALL be found in `src/utils/common/`

### Requirement: Services directory is organized by domain

`src/services/` SHALL group service modules into subdirectories by business domain. Services that do not fit any domain group MAY remain at the top level.

#### Scenario: Auth-related services are grouped
- **WHEN** a developer looks for authentication/authorization services
- **THEN** apiKeyService, apiKeyIndexService, ldapService, userService, and userMessageQueueService SHALL be found in `src/services/auth/`

#### Scenario: Billing-related services are grouped
- **WHEN** a developer looks for billing/cost services
- **THEN** pricingService, costInitService, costRankService, weeklyClaudeCostInitService, serviceRatesService, quotaCardService, and billingEventPublisher SHALL be found in `src/services/billing/`

#### Scenario: Notification services are grouped
- **WHEN** a developer looks for webhook/notification services
- **THEN** webhookService and webhookConfigService SHALL be found in `src/services/notification/`

#### Scenario: Format transformation services are grouped
- **WHEN** a developer looks for API format transformation services
- **THEN** openaiToClaude, codexToOpenAI, geminiToOpenAI, and anthropicGeminiBridgeService SHALL be found in `src/services/transform/`

#### Scenario: Routing configuration services are grouped
- **WHEN** a developer looks for request routing services
- **THEN** claudeRelayConfigService, requestBodyRuleService, requestIdentityService, requestDetailService, modelService, and accountNameCacheService SHALL be found in `src/services/routing/`

### Requirement: Pure utilities live in src/lib/

A new `src/lib/` directory SHALL contain utility modules with zero internal project dependencies (no `require()` calls to other project files).

#### Scenario: Pure crypto functions are in lib
- **WHEN** a developer needs pure cryptographic helper functions
- **THEN** they SHALL be found in `src/lib/crypto.js` and SHALL have no require calls to other project modules

#### Scenario: Pure formatter functions are in lib
- **WHEN** a developer needs pure formatting functions (date, bytes, string)
- **THEN** they SHALL be found in `src/lib/formatters.js` and SHALL have no require calls to other project modules

### Requirement: No directory has more than 15 files at its top level

After restructuring, no source directory under `src/` SHALL contain more than 15 files at its immediate top level (excluding subdirectories and their contents).

#### Scenario: src/utils is not flat
- **WHEN** checking `src/utils/` top-level contents
- **THEN** it SHALL contain only subdirectories and barrel index.js files, with no more than 10 top-level entries

#### Scenario: src/services is organized
- **WHEN** checking `src/services/` top-level contents
- **THEN** it SHALL contain no more than 15 entries (subdirectories plus standalone service files)
