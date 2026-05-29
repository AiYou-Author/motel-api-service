## ADDED Requirements

### Requirement: App initialization is extracted from app.js

The `src/app.js` file SHALL contain only Express application configuration: middleware wiring, route mounting, and static file serving. All startup initialization logic SHALL be moved to a dedicated `src/bootstrap/` module.

#### Scenario: app.js is focused on Express configuration
- **WHEN** reading `src/app.js`
- **THEN** it SHALL be no more than 300 lines and SHALL contain only Express app setup, middleware registration, and route mounting

#### Scenario: Redis initialization is in bootstrap
- **WHEN** the application starts
- **THEN** Redis connection, migration checks, and index maintenance SHALL be handled by `src/bootstrap/redis.js`

#### Scenario: Service initialization is in bootstrap
- **WHEN** the application starts
- **THEN** pricing service init, model service init, cost data init, session window init, cost rank init, API key index init, and account group index init SHALL be handled by `src/bootstrap/services.js`

#### Scenario: Admin setup is in bootstrap
- **WHEN** the application starts
- **THEN** admin credential initialization and invalid session cleanup SHALL be handled by `src/bootstrap/admin.js`

#### Scenario: Bootstrap orchestrates startup sequence
- **WHEN** the application starts
- **THEN** `src/bootstrap/index.js` SHALL orchestrate the startup sequence by calling redis, services, and admin bootstrap modules in the correct order

### Requirement: Application class in app.js delegates to bootstrap

The `Application` class in `app.js` SHALL delegate its `initialize()` method to the bootstrap module.

#### Scenario: Application.initialize uses bootstrap
- **WHEN** `Application.initialize()` is called
- **THEN** it SHALL call `bootstrap.initialize(redis)` rather than containing the initialization logic inline
