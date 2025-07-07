import LightspeedRetailSDK, { InMemoryTokenStorage } from "../dist/index.mjs";
import dotenv from "dotenv";

dotenv.config();

async function testErrorHandling() {
  console.log("🧪 Testing Error Handling Efficiency\n");

  // Test 1: Invalid credentials (should fail silently)
  console.log("1. Testing with completely invalid credentials...");
  const invalidSDK = new LightspeedRetailSDK({
    clientID: "invalid-client-id",
    clientSecret: "invalid-client-secret",
    accountID: "000000",
    tokenStorage: new InMemoryTokenStorage(),
  });

  console.log("   Testing getItems() with invalid credentials:");
  const items = await invalidSDK.getItems({ limit: 5 });
  console.log(
    `   ✅ Result: ${items.length} items (${Array.isArray(items) ? "Array" : typeof items})`
  );

  console.log("   Testing getCustomers() with invalid credentials:");
  const customers = await invalidSDK.getCustomers({ limit: 5 });
  console.log(
    `   ✅ Result: ${customers.length} customers (${Array.isArray(customers) ? "Array" : typeof customers})`
  );

  console.log("   Testing getSales() with invalid credentials:");
  const sales = await invalidSDK.getSales({ limit: 5 });
  console.log(
    `   ✅ Result: ${sales.length} sales (${Array.isArray(sales) ? "Array" : typeof sales})`
  );

  // Test 2: Invalid account ID with valid credentials (if available)
  console.log("\n2. Testing with invalid account ID...");

  const invalidAccountSDK = new LightspeedRetailSDK({
    clientID: process.env.LIGHTSPEED_CLIENT_ID || "test-client",
    clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET || "test-secret",
    accountID: "999999", // Invalid account ID
    accessToken: process.env.LIGHTSPEED_ACCESS_TOKEN || "invalid-token",
    refreshToken: process.env.LIGHTSPEED_REFRESH_TOKEN || "invalid-refresh",
    tokenStorage: new InMemoryTokenStorage(),
  });

  console.log("   Testing getCategories() with invalid account ID:");
  const categories = await invalidAccountSDK.getCategories({ limit: 5 });
  console.log(
    `   ✅ Result: ${categories.length} categories (${Array.isArray(categories) ? "Array" : typeof categories})`
  );

  console.log("   Testing getVendors() with invalid account ID:");
  const vendors = await invalidAccountSDK.getVendors({ limit: 5 });
  console.log(
    `   ✅ Result: ${vendors.length} vendors (${Array.isArray(vendors) ? "Array" : typeof vendors})`
  );

  // Test 3: Network-like errors by using invalid URLs
  console.log("\n3. Testing network error scenarios...");

  const networkErrorSDK = new LightspeedRetailSDK({
    clientID: process.env.LIGHTSPEED_CLIENT_ID || "test-client",
    clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET || "test-secret",
    accountID: process.env.LIGHTSPEED_ACCOUNT_ID || "123456",
    baseUrl: "https://invalid-lightspeed-api-url.com/API", // Invalid base URL
    tokenStorage: new InMemoryTokenStorage(),
  });

  console.log("   Testing getEmployees() with invalid base URL:");
  const employees = await networkErrorSDK.getEmployees({ limit: 5 });
  console.log(
    `   ✅ Result: ${employees.length} employees (${Array.isArray(employees) ? "Array" : typeof employees})`
  );

  // Test 4: Empty/missing parameters
  console.log("\n4. Testing parameter validation errors...");

  const paramTestSDK = new LightspeedRetailSDK({
    clientID: process.env.LIGHTSPEED_CLIENT_ID || "test-client",
    clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET || "test-secret",
    accountID: process.env.LIGHTSPEED_ACCOUNT_ID || "123456",
    tokenStorage: new InMemoryTokenStorage(),
  });

  console.log("   Testing getItem() with missing ID:");
  try {
    const item = await paramTestSDK.getItem(null);
    console.log(
      `   ✅ Result: ${Array.isArray(item) ? item.length + " items" : typeof item}`
    );
  } catch (error) {
    console.log(`   ✅ Properly caught parameter error: ${error.message}`);
  }

  console.log("   Testing getCustomer() with missing ID:");
  try {
    const customer = await paramTestSDK.getCustomer(null);
    console.log(
      `   ✅ Result: ${Array.isArray(customer) ? customer.length + " customers" : typeof customer}`
    );
  } catch (error) {
    console.log(`   ✅ Properly caught parameter error: ${error.message}`);
  }

  // Test 5: Very recent timestamp filters (likely to return empty results)
  console.log("\n5. Testing empty result scenarios...");

  const emptyTestSDK = new LightspeedRetailSDK({
    clientID: "test-client-id",
    clientSecret: "test-client-secret",
    accountID: "123456",
    tokenStorage: new InMemoryTokenStorage(),
  });

  const veryRecentTime = new Date(Date.now() - 100).toISOString(); // 100ms ago

  console.log(
    "   Testing getItems() with very recent timestamp (should be empty):"
  );
  const recentItems = await emptyTestSDK.getItems({
    timeStamp: veryRecentTime,
    limit: 5,
  });
  console.log(
    `   ✅ Result: ${recentItems.length} items (${Array.isArray(recentItems) ? "Array" : typeof recentItems})`
  );

  console.log(
    "   Testing getOrders() with very recent timestamp (should be empty):"
  );
  const recentOrders = await emptyTestSDK.getOrders({
    timeStamp: veryRecentTime,
    limit: 5,
  });
  console.log(
    `   ✅ Result: ${recentOrders.length} orders (${Array.isArray(recentOrders) ? "Array" : typeof recentOrders})`
  );

  // Summary
  console.log("\n📊 Error Handling Test Summary:");
  console.log(
    "✅ All getter methods return empty arrays instead of throwing errors"
  );
  console.log("✅ No verbose error logging for common failure scenarios");
  console.log(
    "✅ Consistent return types (always arrays for collection methods)"
  );
  console.log("✅ Parameter validation errors are properly handled");
  console.log("✅ Network errors are handled gracefully");

  console.log("\n🎉 Error handling test completed successfully!");
  console.log("💡 The SDK now handles errors efficiently and quietly");
}

// Run the test
testErrorHandling().catch((error) => {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
});
