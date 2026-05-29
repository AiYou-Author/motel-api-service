## ADDED Requirements

### Requirement: Every utils subdirectory has a barrel export

Each subdirectory under `src/utils/` SHALL contain an `index.js` that re-exports all public modules from that subdirectory.

#### Scenario: Logging barrel exports all modules
- **WHEN** a file requires `src/utils/logging`
- **THEN** it SHALL receive all exports from logger, tokenRefreshLogger, and safeRotatingAppend

#### Scenario: HTTP barrel exports all modules
- **WHEN** a file requires `src/utils/http`
- **THEN** it SHALL receive all exports from proxyHelper, headerFilter, streamHelper, and sseParser

### Requirement: Every services subdirectory has a barrel export

Each subdirectory under `src/services/` SHALL contain an `index.js` that re-exports all public modules from that subdirectory.

#### Scenario: Auth barrel exports all modules
- **WHEN** a file requires `src/services/auth`
- **THEN** it SHALL receive all public exports from apiKeyService, ldapService, and other auth services

#### Scenario: Billing barrel exports all modules
- **WHEN** a file requires `src/services/billing`
- **THEN** it SHALL receive all public exports from pricingService and other billing services

### Requirement: Top-level utils barrel aggregates sub-barrels

`src/utils/index.js` SHALL re-export from all subdirectory barrels, providing a single import point for all utilities.

#### Scenario: Single import for multiple utils
- **WHEN** a file calls `const { logger, maskToken, proxyHelper } = require('../utils')`
- **THEN** it SHALL receive logger from utils/logging, maskToken from utils/security, and proxyHelper from utils/http

### Requirement: Barrel files do not create circular dependencies

No barrel `index.js` file SHALL import from any sibling barrel. Barrels SHALL only import from their own subdirectory modules.

#### Scenario: Lint rule prevents barrel cross-imports
- **WHEN** a barrel file attempts to require another barrel file
- **THEN** it SHALL be detected as a circular dependency risk during code review

### Requirement: All existing require paths continue to work during migration

During the migration period, deprecated paths SHALL be preserved via proxy files that re-export from the canonical location.

#### Scenario: Old path still resolves
- **WHEN** code uses `require('../../utils/tokenMask')` (the old path)
- **THEN** a proxy file at the old location SHALL re-export from `src/utils/security/tokenMask.js`
