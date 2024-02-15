# Another Unofficial Lightspeed Retail V3 API SDK

A JavaScript SDK for interacting with the Lightspeed Retail API. This SDK provides a convenient way to access Lightspeed Retail's functionalities, including customer, item, order management, and more.

## Update

I have updated this package so it can be used with either index.cjs or index.mjs for imports.

## Features

- Easy-to-use methods for interacting with various Lightspeed Retail endpoints.
- Built-in handling of API rate limits.
- Automatic token management for authentication.
- Support for paginated responses from the Lightspeed API.
- Retry logic for handling transient network issues.

## Installation

```bash
npm install lightspeed-retail-sdk
```

## Get started:

```
import LightspeedRetailSDK from "lightspeed-retail-sdk/index.mjs";

const api = new LightspeedRetailSDK({
  accountID: "Your Account No.",
  clientID: "Your client ID.",
  clientSecret: "Your client secret.",
  refreshToken: "Your refresh token.",
});

export default api
```

## Example Request

```
const item = await api.getItem(7947, '["Category", "Images"]');
console.log(item);

7497 being the itemID. You can pass required relations as above.
```

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

## Contributing

Contributions are welcome!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This SDK is not officially affiliated with Lightspeed HQ and is provided "as is" with no warranty.

## More Info

The documentation for the Lightspeed Retail API can be found at https://developers.lightspeedhq.com/retail/introduction/introduction/
