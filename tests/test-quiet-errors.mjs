#!/usr/bin/env node

import LightspeedRetailSDK from "../index.mjs";

// Test script to demonstrate quiet error handling
async function testQuietErrorHandling() {
  console.log("🔇 Testing quiet error handling for empty responses...\n");

  const sdk = new LightspeedRetailSDK({
    clientID: "invalid-client-id",
    clientSecret: "invalid-secret",
    accountID: "123456",
  });

  console.log("Testing getItems with invalid credentials (should be quiet)...");
  const items = await sdk.getItems({
    timeStamp: "2025-07-07T10:00:00.000Z",
    limit: 5,
  });

  console.log(
    `Result: Retrieved ${items.length} items (${Array.isArray(items) ? "Array" : typeof items})`
  );

  console.log(
    "\nTesting getCustomers with invalid credentials (should be quiet)..."
  );
  const customers = await sdk.getCustomers({
    timeStamp: "2025-07-07T10:00:00.000Z",
    limit: 5,
  });

  console.log(
    `Result: Retrieved ${customers.length} customers (${Array.isArray(customers) ? "Array" : typeof customers})`
  );

  console.log("\n🎉 Error handling test completed!");
  console.log("✅ Much cleaner output - no verbose error logging!");
}

testQuietErrorHandling().catch(console.error);
