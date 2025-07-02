import LightspeedRetailSDK, { FileTokenStorage } from "../index.mjs";
import dotenv from "dotenv";

dotenv.config();

// Create and pre-populate the FileTokenStorage
const tokenStorage = new FileTokenStorage("./tests/live-tokens.json");

// Pre-populate with current tokens
await tokenStorage.setTokens({
  access_token: process.env.LIGHTSPEED_ACCESS_TOKEN,
  refresh_token: process.env.LIGHTSPEED_REFRESH_TOKEN,
  expires_at:
    process.env.LIGHTSPEED_TOKEN_EXPIRES_AT ||
    new Date(Date.now() + 3600000).toISOString(),
  expires_in: 3600,
});

const api = new LightspeedRetailSDK({
  accountID: process.env.LIGHTSPEED_ACCOUNT_ID,
  clientID: process.env.LIGHTSPEED_CLIENT_ID,
  clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET,
  refreshToken: process.env.LIGHTSPEED_REFRESH_TOKEN,
  tokenStorage: tokenStorage,
});

async function testSDK() {
  console.log("🚀 Testing Lightspeed Retail SDK v4.0.0\n");

  // Check if we have the required credentials
  if (
    !process.env.LIGHTSPEED_ACCESS_TOKEN ||
    !process.env.LIGHTSPEED_REFRESH_TOKEN
  ) {
    console.log(
      "⚠️  Missing LIGHTSPEED_ACCESS_TOKEN or LIGHTSPEED_REFRESH_TOKEN in .env file"
    );
    console.log("Please add both tokens from your initial OAuth response");
    return;
  }

  try {
    // Test 1: Check token info first
    console.log("1. Checking token status...");
    const tokenInfo = await api.getTokenInfo();
    console.log("✅ Token info:", tokenInfo);

    // Test 2: Check connection (this will use the stored access token)
    console.log("\n2. Testing API connection...");
    const pingResult = await api.ping();
    console.log("✅ Ping result:", pingResult.status);

    // Test 3: Get account info
    console.log("\n3. Getting account information...");
    const account = await api.getAccount();
    console.log("✅ Account loaded:", account?.Account?.name || "Success");

    // Test 4: Get a few items
    console.log("\n4. Testing items endpoint...");
    const items = await api.getItems("", 10);
    console.log(`✅ Retrieved ${items?.length || 0} items`);

    // Test 5: Test token refresh (only if needed)
    console.log("\n5. Testing token refresh...");
    const refreshResult = await api.refreshTokens();
    console.log(
      "✅ Token refresh:",
      refreshResult.success ? "Success" : "Failed"
    );

    console.log("\n🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    if (error.message.includes("Client authentication failed")) {
      console.log("\n💡 Your tokens may have expired or been revoked");
      console.log("You may need to re-authenticate and get new tokens");
    }
  }
}

// Run the test
testSDK();
