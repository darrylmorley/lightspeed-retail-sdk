# Another Unofficial Lightspeed Retail V3 API SDK

A JavaScript SDK for interacting with the Lightspeed Retail API. This SDK provides a convenient way to access Lightspeed Retail's functionalities, including customer, item, order management, and more.

## 🚨 Important Update - New OAuth System

**Lightspeed has implemented a new OAuth authorization server.** This SDK has been updated to support the new endpoints and token rotation system.

### Key Changes

- **New OAuth endpoints** - Updated to use `https://cloud.lightspeedapp.com/auth/oauth/token`
- **Token rotation** - Both access and refresh tokens now change with each refresh
- **Token persistence** - Tokens must be stored between application restarts
- **Longer token values** - Ensure your storage can handle the new token lengths

## Features

- Easy-to-use methods for interacting with various Lightspeed Retail endpoints.
- Built-in handling of API rate limits.
- Automatic token management for authentication.
- Support for paginated responses from the Lightspeed API.
- Retry logic for handling transient network issues.
- **NEW: Flexible token storage** - File-based, database, or custom storage options.
- Support for both CommonJS and ES modules.

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
  refreshToken: "Your refresh token.",
});

export default api;
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

#### Custom Storage (Database Example)

```javascript
import LightspeedRetailSDK from "lightspeed-retail-sdk";

class DatabaseTokenStorage {
  constructor(userId) {
    this.userId = userId;
  }

  async getTokens() {
    const user = await db.users.findById(this.userId);
    return {
      access_token: user.lightspeed_access_token,
      refresh_token: user.lightspeed_refresh_token,
      expires_at: user.lightspeed_token_expires_at,
    };
  }

  async setTokens(tokens) {
    await db.users.update(this.userId, {
      lightspeed_access_token: tokens.access_token,
      lightspeed_refresh_token: tokens.refresh_token,
      lightspeed_token_expires_at: tokens.expires_at,
    });
  }
}

const api = new LightspeedRetailSDK({
  accountID: "Your Account No.",
  clientID: "Your client ID.",
  clientSecret: "Your client secret.",
  refreshToken: "Your initial refresh token.",
  tokenStorage: new DatabaseTokenStorage(userId),
});
```

## Example Request

```javascript
const item = await api.getItem(7947, '["Category", "Images"]');
console.log(item);

// 7947 being the itemID. You can pass required relations as above.
```

## Token Storage Options

### Built-in Storage Classes

1. **InMemoryTokenStorage** (default) - Stores tokens in memory only
2. **FileTokenStorage** - Stores tokens in a JSON file

### Custom Storage Interface

Implement your own storage by creating a class with these methods:

```javascript
class CustomTokenStorage {
  async getTokens() {
    // Return an object with: { access_token, refresh_token, expires_at }
  }

  async setTokens(tokens) {
    // Store the tokens object: { access_token, refresh_token, expires_at, expires_in }
  }
}
```

## Migration from Previous Versions

If you're upgrading from a previous version:

1. **Update your refresh token** by making one call to the new OAuth endpoint
2. **Implement token storage** to persist the rotating tokens
3. **Update token URLs** (handled automatically by the SDK)
4. **Ensure storage can handle longer tokens** (new tokens are significantly longer)

## Methods

- `getCustomer(id, relations)`: Fetches a specific customer by ID. Optionally, related data can be included.
- `getCustomers(relations)`: Retrieves all customers. Optionally, related data can be included.
- `getItem(id, relations)`: Fetches a specific item by ID. Optionally, related data can be included.
- `getMultipleItems(items, relations)`: Retrieves multiple items by their IDs. Optionally, related data can be included.
- `getItems(relations)`: Retrieves all items. Optionally, related data can be included.
- `getvendorItems(vendorID, relations)`: Retrieves all items for a specific vendor. Optionally, related data can be included.
- `getMatrixItems(relations)`: Fetches all matrix items. Optionally, related data can be included.
- `getMatrixItem(id, relations)`: Fetches a specific matrix item by ID. Optionally, related data can be included.
- `getCategory(id, relations)`: Retrieves a specific category by ID. Optionally, related data can be included.
- `getCategories(relations)`: Retrieves all categories. Optionally, related data can be included.
- `getManufacturer(id, relations)`: Fetches a specific manufacturer by ID. Optionally, related data can be included.
- `getManufacturers(relations)`: Retrieves all manufacturers. Optionally, related data can be included.
- `getOrder(id, relations)`: Fetches a specific order by ID. Optionally, related data can be included.
- `getOrders(relations)`: Retrieves all orders. Optionally, related data can be included.
- `getOrdersByVendorID(id, relations)`: Retrieves all orders for a specific vendor. Optionally, related data can be included.
- `getOpenOrdersByVendorID(id, relations)`: Fetches all open orders for a specific vendor. Optionally, related data can be included.
- `getVendor(id, relations)`: Fetches a specific vendor by ID. Optionally, related data can be included.
- `getVendors(relations)`: Retrieves all vendors. Optionally, related data can be included.
- `getSale(id, relations)`: Fetches a specific sale by ID. Optionally, related data can be included.
- `getSales(relations)`: Retrieves all sales. Optionally, related data can be included.
- `getMultipleSales(saleIDs, relations)`: Fetches multiple sales by their IDs. Optionally, related data can be included.
- `getSaleLinesByItem(itemID, relations)`: Retrieves sale lines for a specific item. Optionally, related data can be included.
- `getSaleLinesByItems(ids, startDate, endDate, relations)`: Retrieves sale lines for multiple items, filtered by date range. Optionally, related data can be included.
- `getSaleLinesByVendorID(id, startDate, endDate, relations)`: Fetches sale lines for a specific vendor, filtered by date range. Optionally, related data can be included.
- `getSpecialOrders(relations)`: Fetches special orders. Optionally, related data can be included.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This SDK is not officially affiliated with Lightspeed HQ and is provided "as is" with no warranty.

## More Info

- [Lightspeed Retail API Documentation](https://developers.lightspeedhq.com/retail/introduction/introduction/)
- [New OAuth Documentation](https://developers.lightspeedhq.com/retail/authentication/oauth/)
