# Another Unofficial Lightspeed Retail V3 API SDK

## Work In Progress

We currently have the following methods available:

```
getCustomers()
getItems()
getItem()
getCategories()
getCategory()
getManufacturers()
getManufacturer()
getOrders()
getOrder()
getVendors()
getVendor()
getSales()
getSale()
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
```

## Example Request

```
const item = await api.getItem(7947, '["Category", "Images"]');
console.log(item);

7497 being the itemID. You can pass required relations as above.
```

## More Info

The documentation for the Lightspeed Retail API can be found at https://developers.lightspeedhq.com/retail/introduction/introduction/