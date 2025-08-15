# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an unofficial Lightspeed Retail API SDK for Node.js that provides modern OAuth authentication, flexible token storage, and comprehensive API coverage. The SDK is built with ES modules and supports both CommonJS and ES module imports.

## Common Development Commands

### Building
```bash
npm run build               # Full build pipeline
npm run clean              # Clean dist directory
npm run prebuild           # Create dist directories
npm run build:esm          # Copy ES modules to dist
npm run build:cjs          # Build CommonJS versions using SWC
npm run fix-paths          # Fix .mjs to .cjs in require statements
npm run fix-exports        # Add CommonJS compatibility exports
```

### Testing
```bash
npm test                   # Run basic test suite
npm run test:mocha         # Run Mocha endpoint tests
npm run test:cjs           # Test CommonJS compatibility
npm run test:storage       # Test token storage systems
npm run test:sqlite        # Test SQLite database storage
npm run test:postgres      # Test PostgreSQL database storage
npm run test:mongodb       # Test MongoDB database storage
npm run test:all           # Run complete test suite
```

### CLI Usage
```bash
npm run cli                # Run CLI locally
npm run generate-key       # Generate encryption key for token storage

# Available CLI commands:
lightspeed-retail-sdk login              # OAuth authentication flow
lightspeed-retail-sdk login --no-browser # OAuth for production/headless environments
lightspeed-retail-sdk inject-tokens      # Interactive token injection
lightspeed-retail-sdk token-status       # Check current token status
lightspeed-retail-sdk whoami            # Show account info
lightspeed-retail-sdk refresh-token     # Manually refresh tokens
lightspeed-retail-sdk migrate-tokens    # Move tokens between storage backends
lightspeed-retail-sdk setup-db          # Create database tables/collections
lightspeed-retail-sdk reset             # Clear stored tokens
lightspeed-retail-sdk test-email        # Test email notifications
```

## Code Architecture

### Core Components

**LightspeedSDK.mjs** (`src/core/`): Main SDK class containing:
- OAuth token management with automatic refresh
- Rate limiting and retry logic
- Centralized query parameter building
- Pagination handling
- All API endpoint methods

**TokenStorage.mjs** (`src/storage/`): Token storage abstraction with multiple implementations:
- `InMemoryTokenStorage`: Basic in-memory storage (not recommended for production)
- `FileTokenStorage`: JSON file-based storage
- `EncryptedTokenStorage`: AES-256-GCM encryption wrapper for any storage adapter
- `DatabaseTokenStorage`: SQLite, PostgreSQL, and MongoDB support

**CLI** (`src/bin/cli.js`): Interactive command-line interface for:
- OAuth authentication flow
- Manual token injection (interactive alternative to OAuth)
- Token management and migration
- Database setup
- Account information retrieval

### API Structure

The SDK follows a consistent pattern:
- `get*()` methods for retrieving data (with automatic pagination)
- `put*()` methods for updates
- `post*()` methods for creation
- Enhanced parameter support with both legacy and object-based syntax

### Token Management

The SDK implements a sophisticated token system:
- Automatic token refresh with 5-minute buffer
- Concurrent refresh protection
- Token rotation support for Lightspeed's new OAuth system
- Email notifications for refresh failures
- Multiple storage backends with encryption

### Build System

Uses SWC for transpilation:
- Converts ES modules to CommonJS for dual-format support
- Maintains separate dist structure for both formats
- Handles import path transformations (.mjs → .cjs)

## Development Notes

### API Methods Pattern
All collection methods support both legacy and modern parameter syntax:
```javascript
// Legacy (still supported)
await sdk.getItems("Category,Vendor", 50);

// Modern object-based
await sdk.getItems({
  relations: "Category,Vendor",
  limit: 50,
  timeStamp: "2025-01-01T00:00:00.000Z",
  sort: "description"
});
```

### Error Handling
- All GET methods return arrays (never undefined)
- Automatic retry for 401 auth errors with token refresh
- Rate limiting with intelligent delays
- Detailed error logging with context

### Database Support
When working with database storage:
- Always uses encrypted storage for security
- Supports PostgreSQL, SQLite, and MongoDB
- Automatic table/collection creation via CLI
- Connection cleanup is handled automatically

### Testing Strategy
- Live API testing with real credentials (tests/live-tokens.json)
- Database integration tests for all supported backends
- CommonJS compatibility testing
- Error handling and edge case testing

### Environment Configuration
Key environment variables:
- `LIGHTSPEED_*` for OAuth credentials
- `SMTP_*` for email notifications
- Database connection strings for persistent storage
- Encryption keys for secure token storage