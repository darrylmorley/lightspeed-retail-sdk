import LightspeedRetailSDK, {
  FileTokenStorage,
  EncryptedTokenStorage,
} from "lightspeed-retail-sdk";
import assert from "assert";
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

const sdk = new LightspeedRetailSDK({
  accountID: process.env.LIGHTSPEED_ACCOUNT_ID,
  clientID: process.env.LIGHTSPEED_CLIENT_ID,
  clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET,
  tokenStorage,
});

// describe("AccountEndpoint", function () {
//   this.timeout(10000);
//   it("should fetch account info", async function () {
//     const result = await sdk.getAccount();
//     console.log("Account info result:", result);
//     assert(result);
//     assert(result && (result.Account || result.data));
//   });
// });

// describe("CategoryEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch categories", async function () {
//     const categories = await sdk.getCategories({ limit: 1 });
//     assert(Array.isArray(categories));
//     assert(categories.length > 0);
//   });
// });

// describe("CategoryEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch a category", async function () {
//     const category = await sdk.getCategory(35);
//     assert(Array.isArray(category));
//     assert(category.length > 0);
//   });
// });

// describe("CustomerEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch customers", async function () {
//     const customers = await sdk.getCustomers({ limit: 1 });
//     assert(Array.isArray(customers));
//     assert(customers.length > 0, "Expected at least one customer");
//   });
// });

// describe("CustomerEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch a customer", async function () {
//     const customer = await sdk.getCustomer(1137);
//     assert(Array.isArray(customer), "Expected an array");
//     assert(customer.length === 1, "Expected exactly one customer");
//     assert(customer[0].customerID === "1137", "Customer ID should match");
//   });
// });

// describe("CustomerEndpoint", function () {
//   this.timeout(30000);
//   it("should search for and return a customer by email", async function () {
//     const customer = await sdk.searchCustomersByEmail(
//       "drobertson61080@gmail.com"
//     );
//     console.log("Searched customer:", customer);
//     assert(Array.isArray(customer), "Expected an array");
//   });
// });

// describe("CustomerTypeEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch customer a type", async function () {
//     const customerType = await sdk.getCustomerType(2);
//     console.log("Customer type:", customerType);
//     assert(Array.isArray(customerType));
//     assert(customerType.length > 0, "Expected at least one customer type");
//   });
// });

// describe("CustomerTypeEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch customer types", async function () {
//     const customerTypes = await sdk.getCustomerTypes({ limit: 1 });
//     console.log("Customer types:", customerTypes);
//     assert(Array.isArray(customerTypes));
//     assert(customerTypes.length > 0, "Expected at least one customer type");
//   });
// });

// describe("EmployeeEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch employee", async function () {
//     const employee = await sdk.getEmployee(1);
//     console.log("Employee:", employee);
//     assert(Array.isArray(employee));
//     assert(employee.length > 0, "Expected at least one employee");
//   });
// });

// describe("EmployeeEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch employees", async function () {
//     const employees = await sdk.getEmployees({ limit: 5 });
//     console.log("Employees:", employees);
//     assert(Array.isArray(employees));
//     assert(employees.length > 0, "Expected at least one employee");
//   });
// });

// describe("GiftCardEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch gift card", async function () {
//     const giftCard = await sdk.getGiftCard("9886168029406212");
//     console.log("Gift card:", giftCard);
//     assert(Array.isArray(giftCard));
//     assert(giftCard.length > 0, "Expected at least one gift card");
//   });
// });

// describe("GiftCardEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch gift cards", async function () {
//     const giftCards = await sdk.getGiftCards({ limit: 5 });
//     console.log("Gift cards:", giftCards);
//     assert(Array.isArray(giftCards));
//     assert(giftCards.length > 0, "Expected at least one gift card");
//   });
// });

// describe("ImageEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch image", async function () {
//     const image = await sdk.getImage(47);
//     console.log("Image:", image);
//     assert(Array.isArray(image));
//     assert(image.length > 0, "Expected at least one image");
//   });
// });

// describe("ImageEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch images", async function () {
//     const images = await sdk.getImages({ limit: 5 });
//     console.log("Images:", images);
//     assert(Array.isArray(images));
//     assert(images.length > 0, "Expected at least one image");
//   });
// });

// describe("ItemEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch item by id", async function () {
//     const item = await sdk.getItem(1);
//     console.log("Item:", item);
//     assert(Array.isArray(item));
//     assert(item.length > 0, "Expected at least one item");
//   });
// });

// describe("ItemEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch items", async function () {
//     const items = await sdk.getItems({ limit: 5 });
//     console.log("Items:", items);
//     assert(Array.isArray(items));
//     assert(items.length > 0, "Expected at least one item");
//   });
// });

// describe("ItemEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch multiple items", async function () {
//     const items = await sdk.getMultipleItems(["2", "3", "8", "9"]);
//     console.log("Items:", items);
//     assert(Array.isArray(items));
//     assert(items.length > 0, "Expected at least one item");
//   });
// });

// describe("ItemEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch items by vendor", async function () {
//     const items = await sdk.getVendorItems(13, {
//       limit: 5,
//     });
//     console.log("Items:", items);
//     assert(Array.isArray(items));
//     assert(items.length > 0, "Expected at least one item");
//   });
// });

// describe("ItemEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch items by categoryID", async function () {
//     const items = await sdk.getItemsByCategory(62, {
//       limit: 5,
//     });
//     console.log("Items:", items);
//     assert(Array.isArray(items));
//     assert(items.length > 0, "Expected at least one item");
//   });
// });

describe("ItemEndpoint", function () {
  this.timeout(30000);
  it("should fetch items with low stock", async function () {
    const items = await sdk.getItemsWithLowStock({
      limit: 5,
      threshold: 1,
    });
    console.log("Items:", items);
    assert(Array.isArray(items));
    assert(items.length > 0, "Expected at least one item");
  });
});

// describe("ItemAttributeEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch item attribute", async function () {
//     const itemAttribute = await sdk.getItemAttribute(1);
//     console.log("Item attribute:", itemAttribute);
//     assert(Array.isArray(itemAttribute));
//     assert(itemAttribute.length > 0, "Expected at least one item attribute");
//   });
// });

// describe("ItemAttributeEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch item attributes", async function () {
//     const itemAttributes = await sdk.getItemAttributes({ limit: 1 });
//     console.log("Item attributes:", itemAttributes);
//     assert(Array.isArray(itemAttributes));
//     assert(itemAttributes.length > 0);
//   });
// });

// describe("ManufacturerEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch manufacturer", async function () {
//     const manufacturer = await sdk.getManufacturer(1);
//     console.log("Manufacturer:", manufacturer);
//     assert(Array.isArray(manufacturer));
//     assert(manufacturer.length > 0, "Expected at least one manufacturer");
//   });
// });

// describe("ManufacturerEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch manufacturers", async function () {
//     const manufacturers = await sdk.getManufacturers({ limit: 1 });
//     console.log("Manufacturers:", manufacturers);
//     assert(Array.isArray(manufacturers));
//     assert(manufacturers.length > 0, "Expected at least one manufacturer");
//   });
// });

// describe("MatrixEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch matrix item", async function () {
//     const matrixItem = await sdk.getMatrixItem(167, { limit: 1 });
//     console.log("Matrix item:", matrixItem);
//     assert(Array.isArray(matrixItem));
//     assert(matrixItem.length > 0, "Expected at least one matrix item");
//   });
// });

// describe("MatrixEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch matrix items", async function () {
//     const matrixItems = await sdk.getMatrixItems({ limit: 1 });
//     console.log("Matrix items:", matrixItems);
//     assert(Array.isArray(matrixItems));
//     assert(matrixItems.length > 0, "Expected at least one matrix item");
//   });
// });

// describe("OrderEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch order", async function () {
//     const order = await sdk.getOrder(1901, { limit: 1 });
//     console.log("Order:", order);
//     assert(Array.isArray(order));
//     assert(order.length > 0, "Expected at least one order");
//   });
// });

// describe("OrderEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch orders", async function () {
//     const orders = await sdk.getOrders({ limit: 1 });
//     console.log("Orders:", orders);
//     assert(Array.isArray(orders));
//     assert(orders.length > 0, "Expected at least one order");
//   });
// });

// describe("OrderEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch orders by vendor id", async function () {
//     const orders = await sdk.getOrdersByVendorID(8, { limit: 1 });
//     console.log("Orders:", orders);
//     assert(Array.isArray(orders));
//     assert(orders.length > 0, "Expected at least one order");
//   });
// });

// describe("OrderEndpoint", function () {
//   this.timeout(30000);
//   it("should fetch open orders by vendor id", async function () {
//     const orders = await sdk.getOpenOrdersByVendorID(13, { limit: 1 });
//     console.log("Orders:", orders);
//     assert(Array.isArray(orders));
//     assert(orders.length > 0, "Expected at least one order");
//     assert(
//       orders[0].complete === "false",
//       "Expected order status to be 'Open'"
//     );
//   });
// });

// describe("SaleEndpoint", function () {
//   this.timeout(10000);
//   it("should fetch sales", async function () {
//     const sales = await sdk.getSales({ limit: 1 });
//     assert(Array.isArray(sales));
//   });
// });

// describe("VendorEndpoint", function () {
//   this.timeout(10000);
//   it("should fetch vendors", async function () {
//     const vendors = await sdk.getVendors({ limit: 1 });
//     assert(Array.isArray(vendors));
//   });
// });
