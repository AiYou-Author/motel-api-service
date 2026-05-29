## Why

The codebase has grown organically over time, resulting in several structural problems that make maintenance and onboarding difficult: 3700-line monolithic service files, a flat 40-file utils directory with no logical grouping, services scattered between subdirectories and the top-level `services/` directory, and deep relative import paths (`../../../`) everywhere. This restructuring reduces cognitive load and makes the codebase easier to navigate without changing any runtime behavior.

## What Changes

- **Reorganize `src/utils/` into subdirectories** by domain (crypto, http, logging, validation, etc.), reducing the flat 40+ file directory to ~8 focused subdirectories
- **Group top-level services into focused subdirectories** — move straggler services like `pricingService.js`, `apiKeyService.js`, `webhookService.js` etc. into appropriate subdirectories (`billing/`, `auth/`, `notification/`, etc.)
- **Break down monolithic files (>1500 lines)** into smaller, focused modules. Each module handles one concern:
  - `claudeAccountService.js` (3617 lines) → split into token management, OAuth, account CRUD, session windows, subscription management
  - `claudeRelayService.js` (3721 lines) → split into request building, response processing, streaming, error handling
  - `anthropicGeminiBridgeService.js` (3291 lines) → split by transformation pipeline stages
  - Other files >1000 lines similarly decomposed
- **Extract app initialization from `app.js`** into a dedicated bootstrap module, keeping `app.js` focused on Express app setup and middleware wiring
- **Consolidate admin route patterns** — the 28 admin route files share common CRUD + list patterns that can be generalized, reducing boilerplate
- **Standardize cross-cutting imports** with a project root alias or barrel exports to eliminate deep relative paths (e.g., `require('../../../../config/config')`)
- **Introduce `src/lib/`** for pure utility functions that have zero service dependencies, separating them from `src/utils/` which contains service-aware helpers

## Capabilities

### New Capabilities

- `project-structure`: New top-level directory layout with `src/lib/` for pure utilities, reorganized `src/utils/` subdirectories, and logically grouped `src/services/` subdirectories
- `service-decomposition`: Breaking monolithic service files (>1500 lines) into smaller, single-concern modules while preserving the existing class-based service pattern
- `bootstrap-extraction`: Extracting app initialization logic from `app.js` into a dedicated `src/bootstrap/` module
- `admin-route-consolidation`: Generic CRUD route factory to reduce boilerplate across 28 admin route files
- `import-resolution`: Barrel exports and path aliases to eliminate deep relative require paths

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **All source files** — directory restructuring affects every `require()` path in the project
- **`src/app.js`** — split into app setup + bootstrap modules
- **`src/utils/`** — all 40+ files reorganized into ~8 subdirectories
- **`src/services/`** — ~30 flat files moved into appropriate subdirectories; 3-5 monolithic files decomposed
- **`src/routes/admin/`** — 28 route files, consolidated with shared factory patterns
- **`src/middleware/`** — minimal changes (already well-organized)
- **Tests** — import paths updated to match new structure
- **No API, config, or behavior changes** — purely structural, zero runtime impact
