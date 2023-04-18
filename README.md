# Another Unofficial Lightspeed Retail V3 API SDK

## Work In Progress

Constributions Welcome

All methods accept relations, these should be provided as strings i.e.: `["relation1", "relation2"]`
We currently have the following methods available,

```
getCustomer(id: int, relations?: string)
getCustomers(relations?: string)
getItem(id: int, relations?: string)
getItems(relations?: string)
getMultipleItems(ids: string = "[102, 103]", relations?: string)
getVendorItems(id: int relations?: string)
getMatrixItems(relations? string)
getMatrixItem(id: int, relations? string)
getCategory(id: int, relations?: string)
getCategories(relations?: string)
getManufacturer(id: int, relations?: string)
getManufacturers(relations?: string)
getOrder(id: int, relations?: string)
getOrders(relations?: string)
getOrdersByVendorID(id: int, relations?: string)
getOpenOrdersByVendorID(id: int, relations?: string)
getVendor(id: int, relations?: string)
getVendors(relations?: string)
getSale(id: int, relations?: string)
getSales(relations?: string)
getSaleLinesByItem(id: int, relations?: string)
getSaleLinesByItems(ids: string = `39, 2126, 3505`, startDate?, endDate?, relations?: string)
getSaleLinesByVendorID(id: int, startDate?, endDate?, relations?: string)
```

## Get started:

```
import LightspeedRetailSDK from "lightspeed-retail-sdk";

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

## More Info

The documentation for the Lightspeed Retail API can be found at https://developers.lightspeedhq.com/retail/introduction/introduction/
