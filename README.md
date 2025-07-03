# Another Unofficial Lightspeed Retail V3 API SDK

A JavaScript SDK for interacting with the Lightspeed Retail API. This SDK provides a convenient way to access Lightspeed Retail's functionalities, including customer, item, order management, and more.

**Current Version: 3.1.1** - Updated with secure encrypted token storage using Node.js crypto.

## 🚨 Important Update - New OAuth System

**Lightspeed has implemented a new OAuth authorization server.** This SDK has been updated to support the new endpoints and token rotation system.

### Key Changes

- **NEW: Encrypted token storage** - Secure your tokens at rest with built-in AES-256-GCM encryption using Node.js crypto
- **New OAuth endpoints** - Updated to use `https://cloud.lightspeedapp.com/auth/oauth/token`
- **Token rotation** - Both access and refresh tokens now change with each refresh
- **Token persistence** - Tokens must be stored between application restarts
- **Longer token values** - Ensure your storage can handle the new token lengths

## Features

- **NEW: Encrypted token storage** - Secure your tokens at rest with built-in AES-256-GCM encryption using Node.js crypto
- Easy-to-use methods for interacting with various Lightspeed Retail endpoints.
- Built-in handling of API rate limits.
- Automatic token management for authentication.
- **NEW: Auto-retry on authentication errors** - Automatically refreshes tokens and retries failed requests.
- Support for paginated responses from the Lightspeed API.
- Retry logic for handling transient network issues.
- **NEW: Flexible token storage** - File-based, database, or custom storage options.
- **NEW: Advanced search capabilities** - Search items and customers with flexible queries.
- **NEW: Bulk operations** - Update multiple items efficiently.
- **NEW: Inventory management** - Low stock alerts and category-based queries.
- Support for both CommonJS and ES modules.

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
```

⚠️ **Note**: Environment variables are used as fallback when no stored tokens are found. Once tokens are stored via your chosen storage method, those take priority.

## Installation

```bash
npm install lightspeed-retail-sdk
```

## Quick Start

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

### Recommended Usage (Persistent Storage)

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
npm run generate-key
```

Add the generated key to your `.env` file:

```env
LIGHTSPEED_ENCRYPTION_KEY=your_64_char_hex_key_here
```

**Usage Example:**

```javascript
import LightspeedRetailSDK, { FileTokenStorage } from "lightspeed-retail-sdk";
import { EncryptedTokenStorage } from "lightspeed-retail-sdk/src/storage/TokenStorage.mjs";
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

#### Database Storage (Built-in Base Class)

The SDK provides a `DatabaseTokenStorage` base class that you can extend:

```javascript
import LightspeedRetailSDK, {
  DatabaseTokenStorage,
} from "lightspeed-retail-sdk";
import mysql from "mysql2/promise";

class MySQLTokenStorage extends DatabaseTokenStorage {
  constructor(connectionConfig, userId) {
    super();
    this.config = connectionConfig;
    this.userId = userId;
  }

  async getTokens() {
    const connection = await mysql.createConnection(this.config);
    try {
      const [rows] = await connection.execute(
        "SELECT access_token, refresh_token, expires_at FROM user_tokens WHERE user_id = ?",
        [this.userId]
      );

      if (rows.length === 0) {
        return { access_token: null, refresh_token: null, expires_at: null };
      }

      return {
        access_token: rows[0].access_token,
        refresh_token: rows[0].refresh_token,
        expires_at: rows[0].expires_at,
      };
    } finally {
      await connection.end();
    }
  }

  async setTokens(tokens) {
    const connection = await mysql.createConnection(this.config);
    try {
      await connection.execute(
        `INSERT INTO user_tokens (user_id, access_token, refresh_token, expires_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE 
         access_token = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         expires_at = VALUES(expires_at),
         updated_at = NOW()`,
        [
          this.userId,
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_at,
        ]
      );
    } finally {
      await connection.end();
    }
  }
}

// Usage
const dbConfig = {
  host: "localhost",
  user: "your_user",
  password: "your_password",
  database: "your_database",
};

const api = new LightspeedRetailSDK({
  accountID: "Your Account No.",
  clientID: "Your client ID.",
  clientSecret: "Your client secret.",
  refreshToken: "Your initial refresh token.",
  tokenStorage: new MySQLTokenStorage(dbConfig, "user123"),
});
```

#### PostgreSQL Example

```javascript
import { DatabaseTokenStorage } from "lightspeed-retail-sdk";
import pg from "pg";

class PostgreSQLTokenStorage extends DatabaseTokenStorage {
  constructor(connectionString, userId) {
    super();
    this.connectionString = connectionString;
    this.userId = userId;
  }

  async getTokens() {
    const client = new pg.Client(this.connectionString);
    await client.connect();

    try {
      const result = await client.query(
        "SELECT access_token, refresh_token, expires_at FROM user_tokens WHERE user_id = $1",
        [this.userId]
      );

      if (result.rows.length === 0) {
        return { access_token: null, refresh_token: null, expires_at: null };
      }

      const row = result.rows[0];
      return {
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expires_at: row.expires_at,
      };
    } finally {
      await client.end();
    }
  }

  async setTokens(tokens) {
    const client = new pg.Client(this.connectionString);
    await client.connect();

    try {
      await client.query(
        `INSERT INTO user_tokens (user_id, access_token, refresh_token, expires_at, updated_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         ON CONFLICT (user_id) DO UPDATE SET 
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         updated_at = NOW()`,
        [
          this.userId,
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_at,
        ]
      );
    } finally {
      await client.end();
    }
  }
}
```

#### MongoDB Example

```javascript
import { DatabaseTokenStorage } from "lightspeed-retail-sdk";
import { MongoClient } from "mongodb";

class MongoTokenStorage extends DatabaseTokenStorage {
  constructor(connectionString, databaseName, userId) {
    super();
    this.connectionString = connectionString;
    this.databaseName = databaseName;
    this.userId = userId;
  }

  async getTokens() {
    const client = new MongoClient(this.connectionString);
    await client.connect();

    try {
      const db = client.db(this.databaseName);
      const collection = db.collection("user_tokens");

      const doc = await collection.findOne({ userId: this.userId });

      if (!doc) {
        return { access_token: null, refresh_token: null, expires_at: null };
      }

      return {
        access_token: doc.access_token,
        refresh_token: doc.refresh_token,
        expires_at: doc.expires_at,
      };
    } finally {
      await client.close();
    }
  }

  async setTokens(tokens) {
    const client = new MongoClient(this.connectionString);
    await client.connect();

    try {
      const db = client.db(this.databaseName);
      const collection = db.collection("user_tokens");

      await collection.updateOne(
        { userId: this.userId },
        {
          $set: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_at,
            updated_at: new Date(),
          },
        },
        { upsert: true }
      );
    } finally {
      await client.close();
    }
  }
}
```

### Custom Storage Interface

Implement your own storage by creating a class with these methods:

```javascript
class CustomTokenStorage {
  async getTokens() {
    // Return an object with: { access_token, refresh_token, expires_at }
    // Return null values if no tokens are stored
  }

  async setTokens(tokens) {
    // Store the tokens object: { access_token, refresh_token, expires_at, expires_in }
  }
}
```

### Database Schema Examples

#### MySQL/PostgreSQL Schema

```sql
CREATE TABLE user_tokens (
  user_id VARCHAR(255) PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### MongoDB Schema

```javascript
// No strict schema required, but documents will look like:
{
  _id: ObjectId("..."),
  userId: "user123",
  access_token: "eyJ0eXAiOiJKV1Q...",
  refresh_token: "def5020058aac34d...",
  expires_at: "2025-07-02T16:09:42.069Z",
  created_at: ISODate("2025-07-02T15:09:42.069Z"),
  updated_at: ISODate("2025-07-02T15:09:42.069Z")
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

## Migration from Previous Versions

If you're upgrading from a previous version:

1. **Update your refresh token** by making one call to the new OAuth endpoint
2. **Implement token storage** to persist the rotating tokens
3. **Update token URLs** (handled automatically by the SDK)
4. **Ensure storage can handle longer tokens** (new tokens are significantly longer)

## API Methods

### Core Resources

#### Customers

- `getCustomer(id, relations)` - Fetch a specific customer by ID
- `getCustomers(relations)` - Retrieve all customers
- `putCustomer(id, data)` - Update a customer
- `postCustomer(data)` - Create a new customer
- `searchCustomers(searchTerm, relations)` - Search customers by name or email

#### Items

- `getItem(id, relations)` - Fetch a specific item by ID
- `getItems(relations, limit)` - Retrieve all items (or limited number if limit specified)
- `getMultipleItems(items, relations)` - Get multiple items by IDs
- `putItem(id, data)` - Update an item
- `postItem(data)` - Create a new item
- `getVendorItems(vendorID, relations)` - Get items by vendor
- `searchItems(searchTerm, relations)` - Search items by description
- `getItemsByCategory(categoryId, relations)` - Get items in a category
- `getItemsWithLowStock(threshold, relations)` - Get items below stock threshold
- `updateMultipleItems(updates)` - Bulk update multiple items

#### Matrix Items

- `getMatrixItem(id, relations)` - Fetch a specific matrix item by ID
- `getMatrixItems(relations)` - Retrieve all matrix items
- `putMatrixItem(id, data)` - Update a matrix item
- `postMatrixItem(data)` - Create a new matrix item

#### Categories

- `getCategory(id, relations)` - Fetch a specific category by ID
- `getCategories(relations)` - Retrieve all categories
- `putCategory(id, data)` - Update a category
- `postCategory(data)` - Create a new category

#### Manufacturers

- `getManufacturer(id, relations)` - Fetch a specific manufacturer by ID
- `getManufacturers(relations)` - Retrieve all manufacturers
- `putManufacturer(id, data)` - Update a manufacturer
- `postManufacturer(data)` - Create a new manufacturer

#### Vendors

- `getVendor(id, relations)` - Fetch a specific vendor by ID
- `getVendors(relations)` - Retrieve all vendors
- `putVendor(id, data)` - Update a vendor
- `postVendor(data)` - Create a new vendor

#### Orders

- `getOrder(id, relations)` - Fetch a specific order by ID
- `getOrders(relations)` - Retrieve all orders
- `getOrdersByVendorID(id, relations)` - Get orders by vendor
- `getOpenOrdersByVendorID(id, relations)` - Get open orders by vendor

#### Sales

- `getSale(id, relations)` - Fetch a specific sale by ID
- `getSales(relations)` - Retrieve all sales
- `getMultipleSales(saleIDs, relations)` - Get multiple sales by IDs
- `getSalesByDateRange(startDate, endDate, relations)` - Get sales in date range
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

- `getEmployees(relations)` - Get all employees
- `getEmployee(id, relations)` - Get a specific employee

#### System Configuration

- `getCustomerTypes(relations)` - Get customer types
- `getRegisters(relations)` - Get registers/shops
- `getPaymentTypes(relations)` - Get payment types
- `getTaxClasses(relations)` - Get tax classes
- `getItemAttributes(relations)` - Get item attributes

### Gift Cards & Special Orders

- `getGiftCards(relations)` - Get all gift cards
- `getGiftCard(id, relations)` - Get a specific gift card by code
- `getSpecialOrders(relations)` - Get special orders

### Images

- `getImages(relations)` - Get all images
- `postImage(imageFilePath, metadata)` - Upload an image

### Utility Methods

- `ping()` - Test API connection and authentication
- `refreshTokens()` - Force refresh of access tokens
- `getTokenInfo()` - Get current token status information

## Error Handling

The SDK includes comprehensive error handling with automatic retries for transient failures:

```javascript
try {
  const item = await api.getItem(123);
  console.log(item);
} catch (error) {
  console.error("API Error:", error.message);
  // Error details are automatically logged by the SDK
}
```

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
