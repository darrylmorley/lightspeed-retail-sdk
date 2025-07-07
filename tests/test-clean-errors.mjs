#!/usr/bin/env node

import LightspeedRetailSDK from "../index.mjs";

// Test script to verify the SDK handles API errors efficiently and quietly
async function testCleanErrorHandling() {
  console.log("🧪 Testing clean error handling with invalid credentials...\n");

  // Test with invalid configuration that will trigger various error conditions
  const sdk = new LightspeedRetailSDK({
    clientID: "test-client-id",
    clientSecret: "test-client-secret",
    accountID: "123456",
  });

  // Test methods that should return empty arrays instead of throwing errors
  const testMethods = [
    { name: "getAccount", method: () => sdk.getAccount() },
    { name: "getCustomers", method: () => sdk.getCustomers() },
    { name: "getItems", method: () => sdk.getItems() },
    { name: "getCategories", method: () => sdk.getCategories() },
    { name: "getManufacturers", method: () => sdk.getManufacturers() },
    { name: "getVendors", method: () => sdk.getVendors() },
    { name: "getOrders", method: () => sdk.getOrders() },
    { name: "getSales", method: () => sdk.getSales() },
    { name: "getEmployees", method: () => sdk.getEmployees() },
    { name: "getMatrixItems", method: () => sdk.getMatrixItems() },
    { name: "getGiftCards", method: () => sdk.getGiftCards() },
    { name: "getSpecialOrders", method: () => sdk.getSpecialOrders() },
    { name: "getImages", method: () => sdk.getImages() },
    { name: "getCustomerTypes", method: () => sdk.getCustomerTypes() },
    { name: "getRegisters", method: () => sdk.getRegisters() },
    { name: "getPaymentTypes", method: () => sdk.getPaymentTypes() },
    { name: "getTaxClasses", method: () => sdk.getTaxClasses() },
    { name: "getItemAttributes", method: () => sdk.getItemAttributes() },
  ];

  console.log(
    `Testing ${testMethods.length} API methods for clean error handling...\n`
  );

  let successCount = 0;
  let errorCount = 0;

  for (const { name, method } of testMethods) {
    try {
      process.stdout.write(`${name}... `);
      const result = await method();

      // Verify that result is always an array or object, never undefined
      if (Array.isArray(result)) {
        console.log(`✅ Array[${result.length}]`);
        successCount++;
      } else if (result && typeof result === "object") {
        console.log(`✅ Object`);
        successCount++;
      } else {
        console.log(`❌ ${typeof result}: ${result}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}/${testMethods.length}`);
  console.log(`   ❌ Errors: ${errorCount}/${testMethods.length}`);

  // Test new object-based parameters
  console.log(`\n🔧 Testing object-based parameters...`);

  const objectTests = [
    {
      name: "getItems({ limit: 5 })",
      method: () => sdk.getItems({ limit: 5 }),
    },
    {
      name: 'getCustomers({ limit: 3, sort: "firstName" })',
      method: () => sdk.getCustomers({ limit: 3, sort: "firstName" }),
    },
    {
      name: 'getSales({ timeStamp: "2025-07-07T10:00:00Z" })',
      method: () => sdk.getSales({ timeStamp: "2025-07-07T10:00:00Z" }),
    },
    {
      name: 'getCategories({ relations: "Parent" })',
      method: () => sdk.getCategories({ relations: "Parent" }),
    },
  ];

  for (const { name, method } of objectTests) {
    try {
      process.stdout.write(`${name}... `);
      const result = await method();

      if (Array.isArray(result)) {
        console.log(`✅ Array[${result.length}]`);
      } else if (result && typeof result === "object") {
        console.log(`✅ Object`);
      } else {
        console.log(`❌ ${typeof result}: ${result}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test legacy parameters
  console.log(`\n📚 Testing legacy parameters...`);

  const legacyTests = [
    {
      name: 'getItems("Category", 5)',
      method: () => sdk.getItems("Category", 5),
    },
    {
      name: 'getCustomers("Contact")',
      method: () => sdk.getCustomers("Contact"),
    },
    {
      name: 'getSales("Customer", 3)',
      method: () => sdk.getSales("Customer", 3),
    },
  ];

  for (const { name, method } of legacyTests) {
    try {
      process.stdout.write(`${name}... `);
      const result = await method();

      if (Array.isArray(result)) {
        console.log(`✅ Array[${result.length}]`);
      } else if (result && typeof result === "object") {
        console.log(`✅ Object`);
      } else {
        console.log(`❌ ${typeof result}: ${result}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log(`\n🎉 Clean error handling test completed!`);
  console.log(`\n🎯 Expected behavior:`);
  console.log(`   • All methods return arrays or objects (never undefined)`);
  console.log(`   • No verbose error logging for authentication failures`);
  console.log(`   • Both legacy and object-based parameters work`);
  console.log(`   • SDK gracefully handles invalid credentials`);
}

testCleanErrorHandling().catch(console.error);
