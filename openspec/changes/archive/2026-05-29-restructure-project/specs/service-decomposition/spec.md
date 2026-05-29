## ADDED Requirements

### Requirement: Monolithic services are decomposed by concern

Services exceeding 1500 lines SHALL be decomposed into a main orchestrator class plus focused concern modules, each handling a single responsibility.

#### Scenario: ClaudeAccountService is decomposed
- **WHEN** examining the Claude account service module
- **THEN** it SHALL exist as a directory at `src/services/account/claude/` containing the main class file plus separate modules for token management, OAuth client, subscription checking, session management, account serialization, and cryptographic helpers

#### Scenario: ClaudeRelayService is decomposed
- **WHEN** examining the Claude relay service module
- **THEN** it SHALL exist as a directory at `src/services/relay/claude/` containing the main class file plus separate modules for request building, response processing, stream handling, and error handling

#### Scenario: AnthropicGeminiBridgeService is decomposed
- **WHEN** examining the Anthropic-to-Gemini bridge service
- **THEN** it SHALL exist as a directory at `src/services/transform/anthropicGemini/` containing the main class file plus separate modules for request transformation, response transformation, tool use mapping, and content conversion

#### Scenario: UnifiedClaudeScheduler is decomposed
- **WHEN** examining the unified Claude scheduler
- **THEN** it SHALL exist as a directory at `src/services/scheduler/claude/` containing the main class file plus separate modules for account selection, sticky session management, and concurrency control

### Requirement: Concern modules export plain functions

Each extracted concern module SHALL export plain functions consumed by the main service class. The main class SHALL delegate to these functions rather than containing all logic inline.

#### Scenario: Token manager is a plain module
- **WHEN** examining the token management module
- **THEN** it SHALL export functions like `refreshToken()`, `rotateCredentials()`, `trackUsage()` and SHALL NOT define a class

#### Scenario: Main class delegates to concern modules
- **WHEN** the main service class needs to refresh a token
- **THEN** it SHALL call `tokenManager.refreshToken(account)` rather than implementing token refresh logic inline

### Requirement: Decomposition preserves existing class API

The decomposition SHALL NOT change the public API of any service class. All existing callers SHALL continue to work without modification.

#### Scenario: Existing callers work unchanged
- **WHEN** another module requires the decomposed service
- **THEN** it SHALL use the same `require()` path and the same method signatures, with no changes needed
