import LightspeedRetailSDK, { FileTokenStorage } from "lightspeed-retail-sdk";

const api = new LightspeedRetailSDK({
  accountID: process.env.LIGHTSPEED_ACCOUNT_ID || "YOUR_ACCOUNT_ID",
  clientID: process.env.LIGHTSPEED_CLIENT_ID || "YOUR_CLIENT_ID",
  clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
  refreshToken: process.env.LIGHTSPEED_REFRESH_TOKEN || "YOUR_REFRESH_TOKEN",
  tokenStorage: new FileTokenStorage("./lightspeed-tokens.json"),
});

export default api;

async function testSDK() {
  console.log("🚀 Testing Lightspeed Retail SDK v4.0.0\n");

  try {
    const api = new LightspeedRetailSDK(config);

    // Test 1: Check connection
    console.log("1. Testing API connection...");
    const pingResult = await api.ping();
    console.log("✅ Ping result:", pingResult.status);

    // Test 2: Get token info
    console.log("\n2. Checking token status...");
    const tokenInfo = await api.getTokenInfo();
    console.log("✅ Token info:", tokenInfo);

    // Test 3: Get account info
    console.log("\n3. Getting account information...");
    const account = await api.getAccount();
    console.log("✅ Account loaded:", account?.Account?.name || "Success");

    // Test 4: Get a few items (limit to first page)
    console.log("\n4. Testing items endpoint...");
    const items = await api.getItems();
    console.log(`✅ Retrieved ${items.length} items`);

    // Test 5: Test token refresh
    console.log("\n5. Testing token refresh...");
    const refreshResult = await api.refreshTokens();
    console.log(
      "✅ Token refresh:",
      refreshResult.success ? "Success" : "Failed"
    );

    console.log("\n🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

// Run the test
testSDK();
