# Another Unofficial Lightspeed Retail V3 API SDK

A modern JavaScript SDK for interacting with the Lightspeed Retail API. This SDK provides a convenient, secure, and flexible way to access Lightspeed Retail's features—including customer, item, and order management.

**Current Version: 3.3.3** — increase token buffer time from 1 minute to 5 minutes for improved token management

## **🆕 Recent Updates (v3.3.3)**

- **Add centralized query param builder for API requests**: Add centralized query param builder for API requests. Supports input as object, string, or array, and manages relations/load_relations. Ensures no double-encoding of parameters and handles special cases for 'or' and 'timeStamp'.
- **🎯 Enhanced Parameter Support**: All main getter methods now support both legacy and new object-based parameters with full backward compatibility
- **🔄 Flexible Method Signatures**: New object-based parameters support `{ relations, limit, timeStamp, sort }` for all collection methods
- **⚡ Improved Performance**: Smart pagination with single-page requests when `limit` is specified
- **🕒 Timestamp Filtering**: Filter records by modification time using ISO timestamp format
- **📊 Better Sorting**: Sort results by any field using the `sort` parameter
- **🔒 Enhanced Error Handling**: All GET methods now return consistent types, never `undefined`
- **🛠️ Robust API Error Recovery**: Graceful handling of bad requests and empty responses
- **🐛 Better Debugging**: Enhanced error logging with URLs, status codes, and response data
- **🔐 Type Safety**: Guaranteed array returns for all list methods
- **📈 Method Coverage**: Updated 20+ methods with new parameter support including getItems, getCustomers, getSales, getOrders, and more

## 🚀 Key Features

- **Modern API**: Object-based parameters with full backward compatibility
- **Timestamp Filtering**: Get only records updated since a specific time
- **Robust Error Handling**: Clean, silent error handling with consistent return types
- **Enhanced CLI**: Browser selection, default scopes, and improved authentication
- **Multiple Storage Options**: File, encrypted, database, and in-memory token storage
- **Comprehensive Coverage**: 20+ API methods with consistent interfaces

## 🔄 Migrating from 3.1.x

### Backward Compatibility

All existing code continues to work unchanged. **No breaking changes in 3.2.0**.

### New Features Available

```javascript
// Old way (still works)
const items = await sdk.getItems("Category,Vendor", 50);

// New way (recommended)
const items = await sdk.getItems({
  relations: "Category,Vendor",
  limit: 50,
  timeStamp: "2025-01-01T00:00:00.000Z",
});
```

### Enhanced Error Handling

- Methods now return empty arrays instead of undefined on errors
- Less verbose logging for common API failures
- Consistent error handling across all methods

### What's New in 3.2.0

- **Object-based parameters** for all 20+ collection methods
- **Timestamp filtering** to get only recent changes
- **Clean error handling** with minimal logging
- **Enhanced CLI** with browser selection and better defaults
- **Improved token management** with better error recovery

---

## Table of Contents

- [Another Unofficial Lightspeed Retail V3 API SDK](#another-unofficial-lightspeed-retail-v3-api-sdk)
  - [**🆕 Recent Updates (v3.3.3)**](#-recent-updates-v333)
  - [🚀 Key Features](#-key-features)
  - [🔄 Migrating from 3.1.x](#-migrating-from-31x)
    - [Backward Compatibility](#backward-compatibility)
    - [New Features Available](#new-features-available)
    - [Enhanced Error Handling](#enhanced-error-handling)
    - [What's New in 3.2.0](#whats-new-in-320)
  - [Table of Contents](#table-of-contents)
  - [🚨 Important Update - New OAuth System](#-important-update---new-oauth-system)
    - [Key Changes](#key-changes)
  - [Interactive CLI](#interactive-cli)
    - [Getting Started with the CLI](#getting-started-with-the-cli)
    - [Available CLI Commands](#available-cli-commands)
      - [Authentication \& Setup](#authentication--setup)
      - [Storage Management](#storage-management)
      - [Email Testing](#email-testing)
    - [CLI Features](#cli-features)
      - [Interactive Storage Selection](#interactive-storage-selection)
      - [OAuth Authentication Flow](#oauth-authentication-flow)
      - [Token Management](#token-management)
        - [Manual Token Refresh](#manual-token-refresh)
        - [Token Status Checking](#token-status-checking)
      - [Database Setup Wizard](#database-setup-wizard)
      - [Token Migration](#token-migration)
      - [Security Features](#security-features)
      - [Email Notifications](#email-notifications)
    - [CLI Configuration](#cli-configuration)
    - [CLI Examples](#cli-examples)
  - [Features](#features)
  - [Smart Token Management](#smart-token-management)
    - [Token Priority Order](#token-priority-order)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
    - [Global CLI Installation (Recommended)](#global-cli-installation-recommended)
    - [Local Installation](#local-installation)
    - [Configuration](#configuration)
  - [Quick Start](#quick-start)
    - [Modern CLI-First Approach (Recommended)](#modern-cli-first-approach-recommended)
      - [Alternative: Local Installation](#alternative-local-installation)
    - [Basic Usage (In-Memory Storage)](#basic-usage-in-memory-storage)
    - [Manual Token Management (Advanced)](#manual-token-management-advanced)
      - [File-Based Storage](#file-based-storage)
      - [Encrypted Storage (Recommended)](#encrypted-storage-recommended)
  - [Database Storage (PostgreSQL, SQLite, and MongoDB)](#database-storage-postgresql-sqlite-and-mongodb)
    - [Database Setup](#database-setup)
      - [Option 1: Use the CLI (Recommended)](#option-1-use-the-cli-recommended)
      - [Option 2: Manual Setup](#option-2-manual-setup)
    - [PostgreSQL Schema](#postgresql-schema)
    - [SQLite Schema](#sqlite-schema)
    - [MongoDB Schema](#mongodb-schema)
    - [Example: Using DatabaseTokenStorage](#example-using-databasetokenstorage)
    - [Notes](#notes)
    - [Custom Storage Interface (Advanced)](#custom-storage-interface-advanced)
  - [CommonJS Usage](#commonjs-usage)
    - [ES Modules (Recommended)](#es-modules-recommended)
    - [CommonJS](#commonjs)
  - [API Methods](#api-methods)
    - [Enhanced Parameter Support](#enhanced-parameter-support)
      - [Legacy Parameter Syntax (Still Supported)](#legacy-parameter-syntax-still-supported)
      - [New Object-Based Parameter Syntax](#new-object-based-parameter-syntax)
      - [Available Parameters](#available-parameters)
    - [Core Resources](#core-resources)
      - [Customers](#customers)
      - [Items](#items)
      - [Matrix Items](#matrix-items)
      - [Categories](#categories)
      - [Manufacturers](#manufacturers)
      - [Vendors](#vendors)
      - [Orders](#orders)
      - [Sales](#sales)
      - [Sale Lines](#sale-lines)
    - [Account \& Configuration](#account--configuration)
      - [Account Information](#account-information)
      - [Employees](#employees)
      - [System Configuration](#system-configuration)
    - [Gift Cards \& Special Orders](#gift-cards--special-orders)
    - [Images](#images)
    - [Utility Methods](#utility-methods)
  - [Error Handling](#error-handling)
    - [**Automatic Error Recovery**](#automatic-error-recovery)
    - [**Safe Return Types**](#safe-return-types)
    - [**Enhanced Error Logging**](#enhanced-error-logging)
    - [**Graceful Degradation**](#graceful-degradation)
  - [Rate Limiting](#rate-limiting)
  - [Pagination](#pagination)
  - [Contributing](#contributing)
  - [License](#license)
  - [Disclaimer](#disclaimer)
  - [More Info](#more-info)

## 🚨 Important Update - New OAuth System

**Lightspeed has implemented a new OAuth authorization server.** This SDK is fully updated to support the new endpoints and token rotation system.

### Key Changes

- **NEW: Encrypted token storage** — Secure your tokens at rest with built-in AES-256-GCM encryption using Node.js crypto
- **New OAuth endpoints** — Uses `https://cloud.lightspeedapp.com/auth/oauth/token`
- **Token rotation** — Both access and refresh tokens now change with each refresh
- **Token persistence** — Tokens must be stored between application restarts
- **Longer token values** — Ensure your storage can handle the new token lengths

## Interactive CLI

The SDK includes a powerful interactive CLI for easy setup, authentication, and token management. No coding required!

### Getting Started with the CLI

The CLI provides an interactive way to:

- Authenticate with Lightspeed OAuth
- Manage tokens across different storage backends
- Set up database storage
- Migrate tokens between storage systems
- View account information

### Available CLI Commands

> **Note**: The examples below assume global installation (`npm install -g lightspeed-retail-sdk`). If you installed locally, prefix commands with `npx` (e.g., `npx lightspeed-retail-sdk login`).

#### Authentication & Setup

```bash
# Start OAuth authentication flow
lightspeed-retail-sdk login

# Start OAuth authentication with specific browser
lightspeed-retail-sdk login --browser firefox
lightspeed-retail-sdk login --browser "google chrome"
lightspeed-retail-sdk login --browser safari

# Check current token status
lightspeed-retail-sdk token-status

# Manually refresh stored access token
lightspeed-retail-sdk refresh-token

# View your account information
lightspeed-retail-sdk whoami
```

#### Storage Management

```bash
# Set up database storage (SQLite, Postgres, MongoDB)
lightspeed-retail-sdk setup-db

# Clear stored tokens
lightspeed-retail-sdk reset

# Migrate tokens between storage backends
lightspeed-retail-sdk migrate-tokens
```

#### Email Testing

```bash
# Test email notification system
lightspeed-retail-sdk test-email

# Test with custom account ID
lightspeed-retail-sdk test-email --account-id "YOUR-ACCOUNT-ID"
```

### CLI Features

#### Interactive Storage Selection

The CLI automatically prompts you to choose your preferred storage backend:

- **File Storage** - Simple JSON file storage
- **Encrypted File Storage** - AES-256-GCM encrypted file storage (recommended)
- **Encrypted Database Storage** - SQLite, PostgreSQL, or MongoDB (always encrypted)

#### OAuth Authentication Flow

```bash
lightspeed-retail-sdk login
```

The login process:

1. Prompts for your Lightspeed credentials (if not in environment)
2. Optionally lets you choose a specific browser
3. Opens browser for OAuth authorization
4. Automatically exchanges code for tokens
5. Stores tokens in your chosen backend

**Note**: If no scopes are specified via environment variables or user input, the default scope `employee:all` will be used.

**Browser Options:**

```bash
# Use default browser
lightspeed-retail-sdk login

# Specify browser via command line
lightspeed-retail-sdk login --browser firefox
lightspeed-retail-sdk login --browser "google chrome"

# Interactive browser selection (when no --browser flag is used)
# The CLI will ask if you want to choose a specific browser
```

#### Token Management

##### Manual Token Refresh

```bash
lightspeed-retail-sdk refresh-token
```

Use this command to:

- Test your refresh token before it expires
- Force a token refresh for testing purposes
- Update access tokens without full re-authentication
- Verify that your stored credentials are working

The command will:

- Show current token expiration status
- Attempt to refresh using stored refresh token
- Display the new token information
- Handle token rotation if enabled by Lightspeed

##### Token Status Checking

```bash
lightspeed-retail-sdk token-status
```

Shows detailed information about your stored tokens including expiration times.

#### Database Setup Wizard

```bash
lightspeed-retail-sdk setup-db
```

- Guides you through database connection setup
- Creates required tables/collections
- Tests database connectivity
- Supports local and cloud databases

#### Token Migration

```bash
lightspeed-retail-sdk migrate-tokens
```

- Move tokens between any supported storage backends
- Automatically creates destination storage if needed
- Confirms before overwriting existing tokens
- Validates successful migration

#### Security Features

- **Database tokens are always encrypted** - Uses AES-256-GCM encryption automatically
- **Secure credential prompting** - Sensitive inputs are handled securely
- **Environment variable support** - Use `.env` files for configuration
- **Connection cleanup** - Proper database connection management

#### Email Notifications

The SDK can automatically send email alerts when token refresh fails:

```bash
# Configure SMTP settings in your .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false           # true for 465, false for other ports
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password # Use app passwords for Gmail
SMTP_FROM=your-email@gmail.com  # Optional, defaults to SMTP_USER
ALERT_EMAIL=admin@yourcompany.com

# Test the email system
lightspeed-retail-sdk test-email
```

**Email Features:**

- Automatic alerts on token refresh failures
- Detailed error information and recovery steps
- Configurable SMTP settings
- Built-in test command for validation

### CLI Configuration

You can configure the CLI using environment variables:

```bash
# Token storage location
LIGHTSPEED_TOKEN_FILE=./tokens/encrypted-tokens.json

# Encryption key for secure storage
LIGHTSPEED_ENCRYPTION_KEY=your_64_char_hex_key

# Database connections (for database storage)
LIGHTSPEED_POSTGRES_URL=postgres://user:pass@host:5432/db
LIGHTSPEED_MONGO_URL=mongodb://localhost:27017/lightspeed

# OAuth credentials
LIGHTSPEED_CLIENT_ID=your_client_id
LIGHTSPEED_CLIENT_SECRET=your_client_secret
LIGHTSPEED_ACCOUNT_ID=your_account_id
LIGHTSPEED_REDIRECT_URL=your_lightspeed_redirect_url

# Optional: OAuth scopes (defaults to "employee:all" if not specified)
LIGHTSPEED_SCOPES=employee:all inventory:all
```

### CLI Examples

**Complete setup from scratch:**

```bash
# 1. Generate encryption key and add to .env
node -e "console.log('LIGHTSPEED_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# 2. Set up database storage
lightspeed-retail-sdk setup-db

# 3. Authenticate and store tokens (with browser choice)
lightspeed-retail-sdk login --browser firefox

# 4. Verify setup
lightspeed-retail-sdk whoami
```

**Migrate from file to database:**

```bash
lightspeed-retail-sdk migrate-tokens
# Select "Encrypted File" as source
# Select "Encrypted Database" as destination
# Choose your database type and connection
```

**Check token status:**

```bash
lightspeed-retail-sdk token-status
# Shows token validity, expiration, and storage location
```

The CLI makes it easy to get started with the SDK without writing any configuration code!

## Features

- **Interactive CLI** — Complete command-line interface for authentication, token management, and database setup
- **Encrypted token storage** — Secure your tokens at rest with built-in AES-256-GCM encryption using Node.js crypto
- **Email notifications** — Automatic alerts for token refresh failures with configurable SMTP settings
- **Flexible storage backends** — File-based, encrypted, database (SQLite, PostgreSQL, MongoDB), or custom storage options
- **Smart token management** — Automatic refresh, rotation handling, and persistent storage
- **Auto-retry on authentication errors** — Automatically refreshes tokens and retries failed requests
- Easy-to-use methods for all major Lightspeed Retail endpoints
- Built-in handling of API rate limits and pagination
- Retry logic for transient network issues
- Advanced search capabilities for items and customers
- Bulk operations for efficient data updates
- Inventory management with low stock alerts and category queries
- Support for both CommonJS and ES modules

## Smart Token Management

The SDK intelligently manages tokens with these features:

- **Automatic refresh** - Tokens are refreshed before they expire (1-minute buffer)
- **Auto-retry on 401 errors** - If a token is invalid, the SDK automatically refreshes and retries the request
- **Persistent storage priority** - Always checks stored tokens first, falls back to environment variables
- **Token rotation support** - Handles Lightspeed's new token rotation system seamlessly

### Token Priority Order

1. **Stored tokens** (from your chosen storage method)
2. **Environment variables** (fallback)
3. **Automatic refresh** (when expired)

## Environment Variables

For development and testing, you can use environment variables:

```bash
# Required
LIGHTSPEED_ACCOUNT_ID=your_account_id
LIGHTSPEED_CLIENT_ID=your_client_id
LIGHTSPEED_CLIENT_SECRET=your_client_secret

# Optional (for initial setup)
LIGHTSPEED_ACCESS_TOKEN=your_access_token
LIGHTSPEED_REFRESH_TOKEN=your_refresh_token
LIGHTSPEED_TOKEN_EXPIRES_AT=2025-01-01T00:00:00.000Z

# Storage Configuration (CLI only)
LIGHTSPEED_TOKEN_FILE=./tokens/encrypted-tokens.json
LIGHTSPEED_ENCRYPTION_KEY=your-64-character-encryption-key

# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
ALERT_EMAIL=admin@yourcompany.com
```

⚠️ **Note**: Environment variables are used as fallback when no stored tokens are found. Once tokens are stored via your chosen storage method, those take priority.

## Installation

```bash
npm install lightspeed-retail-sdk
```

### Global CLI Installation (Recommended)

For the best experience, install the SDK globally to access the CLI from anywhere:

```bash
npm install -g lightspeed-retail-sdk
```

Once installed globally, you can use the CLI directly:

```bash
lightspeed-retail-sdk help
lightspeed-retail-sdk login
lightspeed-retail-sdk token-status
lightspeed-retail-sdk whoami
```

### Local Installation

If you prefer local installation or are using the SDK in a specific project:

```bash
npm install lightspeed-retail-sdk
```

Then use the CLI with `npx`:

```bash
npx lightspeed-retail-sdk help
npx lightspeed-retail-sdk login
npx lightspeed-retail-sdk token-status
```

Or add scripts to your `package.json`:

```json
{
  "scripts": {
    "lightspeed-setup": "lightspeed-retail-sdk login",
    "lightspeed-status": "lightspeed-retail-sdk token-status",
    "lightspeed-refresh": "lightspeed-retail-sdk refresh-token"
  }
}
```

Then run:

```bash
npm run lightspeed-setup
npm run lightspeed-status
```

### Configuration

Create a `.env` file in your project root (where you'll run the CLI commands) with your Lightspeed credentials:

```bash
# Required OAuth credentials
LIGHTSPEED_CLIENT_ID=your_client_id
LIGHTSPEED_CLIENT_SECRET=your_client_secret
LIGHTSPEED_ACCOUNT_ID=your_account_id
LIGHTSPEED_REDIRECT_URL=your_redirect_url

# Optional: Storage configuration
LIGHTSPEED_TOKEN_FILE=./tokens/encrypted-tokens.json
LIGHTSPEED_ENCRYPTION_KEY=your_64_char_hex_key

# Optional: Database connections
LIGHTSPEED_POSTGRES_URL=postgres://user:pass@host:5432/db
LIGHTSPEED_MONGO_URL=mongodb://localhost:27017/lightspeed

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL=admin@yourcompany.com

# Optional: OAuth scopes (defaults to "employee:all")
LIGHTSPEED_SCOPES=employee:all
```

Generate an encryption key for secure token storage:

```bash
# Run this command to generate a secure encryption key
node -e "console.log('LIGHTSPEED_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated key to your `.env` file.

> **Note**: The CLI will read configuration from the `.env` file in your current working directory, making setup much easier by reducing the number of prompts.

## Quick Start

### Modern CLI-First Approach (Recommended)

The easiest way to get started is using the interactive CLI to handle authentication:

```bash
# 1. Install the SDK globally
npm install -g lightspeed-retail-sdk

# 2. Authenticate using CLI (one-time setup)
lightspeed-retail-sdk login

# 3. Use the SDK in your code
```

#### Alternative: Local Installation

```bash
# 1. Install the SDK locally
npm install lightspeed-retail-sdk

# 2. Authenticate using CLI (one-time setup)
npx lightspeed-retail-sdk login

# 3. Use the SDK in your code
```

Then in your code:

```javascript
import LightspeedRetailSDK, {
  FileTokenStorage,
  EncryptedTokenStorage,
} from "lightspeed-retail-sdk";
import dotenv from "dotenv";
dotenv.config();

// Use the same storage configuration as your CLI
const fileStorage = new FileTokenStorage(
  process.env.LIGHTSPEED_TOKEN_FILE || "./tokens/encrypted-tokens.json"
);
const tokenStorage = process.env.LIGHTSPEED_ENCRYPTION_KEY
  ? new EncryptedTokenStorage(
      fileStorage,
      process.env.LIGHTSPEED_ENCRYPTION_KEY
    )
  : fileStorage;

const api = new LightspeedRetailSDK({
  accountID: process.env.LIGHTSPEED_ACCOUNT_ID,
  clientID: process.env.LIGHTSPEED_CLIENT_ID,
  clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET,
  tokenStorage,
});

// The SDK will automatically use stored tokens and refresh as needed
export default api;
```

### Basic Usage (In-Memory Storage)

```javascript
import LightspeedRetailSDK from "lightspeed-retail-sdk";

const api = new LightspeedRetailSDK({
  accountID: "Your Account No.",
  clientID: "Your client ID.",
  clientSecret: "Your client secret.",
  refreshToken: "Your initial refresh token.",
  // No tokenStorage = uses InMemoryTokenStorage by default
});
```

⚠️ **Warning**: Basic usage stores tokens in memory only. Tokens will be lost on application restart, which may cause issues with Lightspeed's new token rotation system.

### Manual Token Management (Advanced)

If you prefer to handle authentication manually without the CLI:

#### File-Based Storage

```javascript
import LightspeedRetailSDK, { FileTokenStorage } from "lightspeed-retail-sdk";

const api = new LightspeedRetailSDK({
  accountID: "Your Account No.",
  clientID: "Your client ID.",
  clientSecret: "Your client secret.",
  refreshToken: "Your initial refresh token.",
  tokenStorage: new FileTokenStorage("./lightspeed-tokens.json"),
});

export default api;
```

#### Encrypted Storage (Recommended)

You can now store your tokens **encrypted at rest** using the built-in `EncryptedTokenStorage` class. This works as a wrapper around any storage adapter (such as `FileTokenStorage`) and uses AES-256-GCM encryption with a key you provide.

**Generate a key** (if you haven't already):

```bash
node -e "console.log('LIGHTSPEED_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated key to your `.env` file:

```env
LIGHTSPEED_ENCRYPTION_KEY=your_64_char_hex_key_here
```

**Usage Example:**

```javascript
import LightspeedRetailSDK, {
  FileTokenStorage,
  EncryptedTokenStorage,
} from "lightspeed-retail-sdk";
import dotenv from "dotenv";
dotenv.config();

const fileStorage = new FileTokenStorage("./lightspeed-tokens.json");
const encryptionKey = process.env.LIGHTSPEED_ENCRYPTION_KEY;

const tokenStorage = encryptionKey
  ? new EncryptedTokenStorage(fileStorage, encryptionKey)
  : fileStorage;

const api = new LightspeedRetailSDK({
  accountID: "Your Account No.",
  clientID: "Your client ID.",
  clientSecret: "Your client secret.",
  refreshToken: "Your initial refresh token.",
  tokenStorage,
});

export default api;
```

- If `LIGHTSPEED_ENCRYPTION_KEY` is set, your tokens will be encrypted transparently.
- If not, it falls back to plain file storage (backward compatible).
- The encryption uses AES-256-GCM and is fully compatible with existing token files (it will auto-detect and migrate as needed).

**Note:**  
Keep your encryption key secure and never commit it to version control!

---

## Database Storage (PostgreSQL, SQLite, and MongoDB)

### Database Setup

#### Option 1: Use the CLI (Recommended)

```bash
lightspeed-retail-sdk setup-db
```

The CLI will guide you through creating the required tables/collections for your database.

#### Option 2: Manual Setup

If you prefer to create the database schema manually, use the schemas below:

### PostgreSQL Schema

```sql
CREATE TABLE oauth_tokens (
  app_id TEXT PRIMARY KEY,
  tokens JSONB NOT NULL
);
```

- `app_id`: Used to support multiple apps or tenants (default is `"default"`).
- `tokens`: Stores the full token object as JSON.

### SQLite Schema

```sql
CREATE TABLE oauth_tokens (
  app_id TEXT PRIMARY KEY,
  tokens TEXT NOT NULL
);
```

- `tokens` is stored as a JSON string.

### MongoDB Schema

For MongoDB, no manual schema creation is required. The SDK will create documents with this structure:

```javascript
{
  app_id: "default",
  tokens: {
    access_token: "...",
    refresh_token: "...",
    expires_at: "2025-01-01T00:00:00.000Z",
    expires_in: 3600
  }
}
```

- The collection name is configurable (default: `oauth_tokens`)
- A unique index on `app_id` is automatically created

---

### Example: Using DatabaseTokenStorage

> **Note:** You can use local or cloud database connection strings (for example, Heroku Postgres, MongoDB Atlas, etc.) in all examples below.

```javascript
import { DatabaseTokenStorage } from "lightspeed-retail-sdk";

// PostgreSQL
const pgStorage = new DatabaseTokenStorage(
  "postgres://user:pass@host:5432/dbname",
  {
    dbType: "postgres",
    tableName: "oauth_tokens", // optional
    appId: "default", // optional
  }
);

// SQLite
const sqliteStorage = new DatabaseTokenStorage("./tokens.sqlite", {
  dbType: "sqlite",
  tableName: "oauth_tokens", // optional
  appId: "default", // optional
});

// MongoDB
const mongoStorage = new DatabaseTokenStorage(
  "mongodb://localhost:27017/yourdb",
  {
    dbType: "mongodb",
    tableName: "oauth_tokens", // optional (collection name)
    appId: "default", // optional
  }
);
```

---

### Notes

- **You must create the table or collection before using the SDK.** The SDK does not auto-create tables or collections.
- For multi-tenant or multi-app setups, use a unique `appId` for each logical app.
- The SDK stores the entire token object (including access, refresh, and expiry) in the `tokens` field.
- For MongoDB, you may use any database name in your connection string; the collection name is configurable.

---

### Custom Storage Interface (Advanced)

> **Note:** Most users do not need to implement a custom storage backend. This is only for advanced use cases where you need to integrate with a non-standard storage system (for example, a custom API, key-value store, or enterprise secrets manager).

To implement your own storage, create a class with these asynchronous methods:

```javascript
class CustomTokenStorage {
  async getTokens() {
    // Return an object: { access_token, refresh_token, expires_at }
    // Return null if no tokens are stored
  }

  async setTokens(tokens) {
    // Store the tokens object: { access_token, refresh_token, expires_at, expires_in }
  }
}
```

## CommonJS Usage

The SDK supports both ES modules and CommonJS:

### ES Modules (Recommended)

```javascript
import LightspeedRetailSDK, {
  FileTokenStorage,
  DatabaseTokenStorage,
} from "lightspeed-retail-sdk";
```

### CommonJS

```javascript
const LightspeedRetailSDK = require("lightspeed-retail-sdk");
const {
  FileTokenStorage,
  DatabaseTokenStorage,
} = require("lightspeed-retail-sdk");
```

## API Methods

### Enhanced Parameter Support

**All main getter methods now support both legacy and new object-based parameters:**

#### Legacy Parameter Syntax (Still Supported)

```javascript
const customers = await api.getCustomers("Contact");
const items = await api.getItems("Category,Vendor", 50);
const sales = await api.getSales("Customer", 25);
```

#### New Object-Based Parameter Syntax

```javascript
const customers = await api.getCustomers({
  relations: "Contact",
  limit: 50,
  timeStamp: "2025-07-07T10:00:00.000Z",
  sort: "timeStamp",
});

const items = await api.getItems({
  relations: "Category,Vendor",
  limit: 25,
  timeStamp: "2025-07-07T10:00:00.000Z",
  sort: "description",
});

const sales = await api.getSales({
  relations: "Customer",
  limit: 100,
  timeStamp: "2025-07-07T10:00:00.000Z",
  sort: "timeStamp",
});
```

#### Available Parameters

- **relations**: Load related data (e.g., 'Category,Vendor')
- **limit**: Limit number of results (max 100) - triggers single-page request
- **timeStamp**: Filter by timestamp (ISO format) - retrieves records updated since this time
- **sort**: Sort results by field (e.g., 'timeStamp', 'description')

### Core Resources

#### Customers

- `getCustomer(id, relations)` - Fetch a specific customer by ID
- `getCustomers(params)` - Retrieve all customers ✨ **Enhanced with object parameters**
- `putCustomer(id, data)` - Update a customer
- `postCustomer(data)` - Create a new customer
- `searchCustomers(searchTerm, relations)` - Search customers by name or email

#### Items

- `getItem(id, relations)` - Fetch a specific item by ID
- `getItems(params)` - Retrieve all items ✨ **Enhanced with object parameters**
- `getMultipleItems(items, relations)` - Get multiple items by IDs
- `putItem(id, data)` - Update an item
- `postItem(data)` - Create a new item
- `getVendorItems(vendorID, relations)` - Get items by vendor
- `searchItems(searchTerm, relations)` - Search items by description
- `getItemsByCategory(params)` - Get items in a category ✨ **Enhanced with object parameters**
- `getItemsWithLowStock(params)` - Get items below stock threshold ✨ **Enhanced with object parameters**
- `updateMultipleItems(updates)` - Bulk update multiple items

**Enhanced getItems Examples:**

```javascript
// Legacy usage (still works)
const items = await api.getItems("Category,Vendor", 50);

// New object-based usage with timestamp filtering
const recentItems = await api.getItems({
  timeStamp: "2025-07-07T10:00:00.000Z", // Items updated since this timestamp
  relations: "Category,Vendor",
  sort: "timeStamp",
});

// Basic usage with relations only
const itemsWithCategories = await api.getItems({ relations: "Category" });
```

#### Matrix Items

- `getMatrixItem(id, relations)` - Fetch a specific matrix item by ID
- `getMatrixItems(params)` - Retrieve all matrix items ✨ **Enhanced with object parameters**
- `putMatrixItem(id, data)` - Update a matrix item
- `postMatrixItem(data)` - Create a new matrix item

#### Categories

- `getCategory(id, relations)` - Fetch a specific category by ID
- `getCategories(params)` - Retrieve all categories ✨ **Enhanced with object parameters**
- `putCategory(id, data)` - Update a category
- `postCategory(data)` - Create a new category

#### Manufacturers

- `getManufacturer(id, relations)` - Fetch a specific manufacturer by ID
- `getManufacturers(params)` - Retrieve all manufacturers ✨ **Enhanced with object parameters**
- `putManufacturer(id, data)` - Update a manufacturer
- `postManufacturer(data)` - Create a new manufacturer

#### Vendors

- `getVendor(id, relations)` - Fetch a specific vendor by ID
- `getVendors(params)` - Retrieve all vendors ✨ **Enhanced with object parameters**
- `putVendor(id, data)` - Update a vendor
- `postVendor(data)` - Create a new vendor

#### Orders

- `getOrder(id, relations)` - Fetch a specific order by ID
- `getOrders(params)` - Retrieve all orders ✨ **Enhanced with object parameters**
- `getOrdersByVendorID(id, relations)` - Get orders by vendor
- `getOpenOrdersByVendorID(id, relations)` - Get open orders by vendor

#### Sales

- `getSale(id, relations)` - Fetch a specific sale by ID
- `getSales(params)` - Retrieve all sales ✨ **Enhanced with object parameters**
- `getMultipleSales(saleIDs, relations)` - Get multiple sales by IDs
- `getSalesByDateRange(params)` - Get sales in date range ✨ **Enhanced with object parameters**
- `putSale(id, data)` - Update a sale
- `postSale(data)` - Create a new sale

#### Sale Lines

- `getSaleLinesByItem(itemID, relations)` - Get sale lines for an item
- `getSaleLinesByItems(ids, startDate, endDate, relations)` - Get sale lines for multiple items with date filter
- `getSaleLinesByVendorID(id, startDate, endDate, relations)` - Get sale lines by vendor with date filter

### Account & Configuration

#### Account Information

- `getAccount(relations)` - Get account/shop information

#### Employees

- `getEmployees(params)` - Get all employees ✨ **Enhanced with object parameters**
- `getEmployee(id, relations)` - Get a specific employee

#### System Configuration

- `getCustomerTypes(params)` - Get customer types ✨ **Enhanced with object parameters**
- `getRegisters(params)` - Get registers/shops ✨ **Enhanced with object parameters**
- `getPaymentTypes(params)` - Get payment types ✨ **Enhanced with object parameters**
- `getTaxClasses(params)` - Get tax classes ✨ **Enhanced with object parameters**
- `getItemAttributes(params)` - Get item attributes ✨ **Enhanced with object parameters**

### Gift Cards & Special Orders

- `getGiftCards(params)` - Get all gift cards ✨ **Enhanced with object parameters**
- `getGiftCard(id, relations)` - Get a specific gift card by code
- `getSpecialOrders(params)` - Get special orders ✨ **Enhanced with object parameters**

### Images

- `getImages(params)` - Get all images ✨ **Enhanced with object parameters**
- `postImage(imageFilePath, metadata)` - Upload an image

### Utility Methods

- `ping()` - Test API connection and authentication
- `refreshTokens()` - Force refresh of access tokens
- `getTokenInfo()` - Get current token status information

## Error Handling

The SDK includes comprehensive error handling with automatic retries for transient failures and robust safety guarantees:

### **Automatic Error Recovery**

- **Retry Logic**: Automatic retries for network errors and 5xx server errors
- **401 Handling**: Automatic token refresh and request retry on authentication failures
- **Rate Limiting**: Intelligent delays when approaching API rate limits

### **Safe Return Types**

All GET methods are guaranteed to return consistent data types, never `undefined`:

```javascript
try {
  // These methods ALWAYS return arrays (never undefined)
  const items = await api.getItems({ timeStamp: "2025-07-07T10:00:00Z" });
  const customers = await api.getCustomers();
  const categories = await api.getCategories();

  // Safe to access array properties without checking for undefined
  console.log(`Found ${items.length} items`);

  // Even on API errors, you get an empty array
  if (items.length === 0) {
    console.log("No items found or API error occurred");
  }
} catch (error) {
  console.error("SDK Error:", error.message);
  // Detailed error logging is handled automatically by the SDK
}
```

### **Enhanced Error Logging**

When errors occur, the SDK provides detailed logging including:

- Request URLs and parameters
- HTTP status codes and response data
- Helpful context for debugging
- Email notifications (when configured) for token refresh failures

### **Graceful Degradation**

- API errors don't crash your application
- Empty arrays returned instead of undefined
- Detailed error messages logged for debugging
- Automatic fallback behavior for common scenarios

## Rate Limiting

The SDK automatically handles Lightspeed's API rate limits by:

- Monitoring rate limit headers
- Calculating appropriate delays
- Automatically waiting when limits are approached

## Pagination

For endpoints that return large datasets, the SDK automatically handles pagination:

```javascript
// This will automatically fetch all pages
const allItems = await api.getItems();
console.log(`Retrieved ${allItems.length} items`);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This SDK is not officially affiliated with Lightspeed HQ and is provided "as is" with no warranty.

## More Info

- [Lightspeed Retail API Documentation](https://developers.lightspeedhq.com/retail/introduction/introduction/)
- [New OAuth Documentation](https://developers.lightspeedhq.com/retail/authentication/oauth/)
