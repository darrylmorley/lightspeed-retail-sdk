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
- **NEW: Advanced search capabilities** - Search items and customers with flexible queries.
- **NEW: Bulk operations** - Update multiple items efficiently.
- **NEW: Inventory management** - Low stock alerts and category-based queries.
- Support for both CommonJS and ES modules.

## Installation

```bash
npm install lightspeed-retail-sdk
```

## Quick Start

### Basic Usage (In-Memory Storage)

```javascript
import LightspeedRetailSDK, { FileTokenStorage } from "lightspeed-retail-sdk";

const api = new LightspeedRetailSDK({
  accountID: "Your Account No.",
  clientID: "Your client ID.",
  clientSecret: "Your client secret.",
  refreshToken: "Your initial refresh token.",
  tokenStorage: new FileTokenStorage("./lightspeed-tokens.json"),
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

## Example Requests

```javascript
// Basic item request
const item = await api.getItem(7947, '["Category", "Images"]');
console.log(item);

// Search for items
const searchResults = await api.searchItems("iPhone", '["Category"]');

// Get low stock items
const lowStockItems = await api.getItemsWithLowStock(10, '["Category"]');

// Bulk update items
const updates = [
  { itemID: 123, data: { description: "Updated description" } },
  { itemID: 456, data: { qoh: 50 } },
];
const results = await api.updateMultipleItems(updates);

// Check API connection
const status = await api.ping();
console.log(status);
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
- `getItems(relations)` - Retrieve all items
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
