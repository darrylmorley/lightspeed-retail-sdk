const LightspeedRetailSDK = require("../dist/index.cjs");
const { FileTokenStorage } = require("../dist/index.cjs");
const {
  EncryptedTokenStorage,
} = require("../dist/src/storage/TokenStorage.cjs");
require("dotenv").config();

async function testCJS() {
  console.log("📦 Testing CommonJS version\n");

  try {
    // Create FileTokenStorage instance
    const fileStorage = new FileTokenStorage("./live-tokens.json");

    const encryptionKey = process.env.LIGHTSPEED_ENCRYPTION_KEY;
    const tokenStorage = encryptionKey
      ? new EncryptedTokenStorage(fileStorage, encryptionKey)
      : fileStorage;

    // Try to get existing tokens from file storage first
    let storedTokens = await tokenStorage.getTokens();
    console.log("🔍 Checking for stored tokens...");

    const hasStoredTokens =
      storedTokens.access_token && storedTokens.refresh_token;

    if (hasStoredTokens) {
      console.log("✅ Found stored tokens, using them");
    } else {
      console.log(
        "⚠️  No stored tokens found, checking environment variables..."
      );

      // Check if we have env vars to populate storage
      if (
        process.env.LIGHTSPEED_ACCESS_TOKEN &&
        process.env.LIGHTSPEED_REFRESH_TOKEN
      ) {
        console.log("✅ Found environment tokens, storing them");

        // Populate storage with env vars
        await tokenStorage.setTokens({
          access_token: process.env.LIGHTSPEED_ACCESS_TOKEN,
          refresh_token: process.env.LIGHTSPEED_REFRESH_TOKEN,
          expires_at:
            process.env.LIGHTSPEED_TOKEN_EXPIRES_AT ||
            new Date(Date.now() + 3600000).toISOString(),
          expires_in: 3600,
        });

        storedTokens = await tokenStorage.getTokens();
      } else {
        console.log("⚠️  No credentials found - skipping CommonJS API tests");
        console.log("💡 Run the ES module test first: npm run test");
        console.log("   Or add credentials to your .env file");
        return;
      }
    }

    // Check if we have the minimum required credentials
    if (
      !process.env.LIGHTSPEED_ACCOUNT_ID ||
      !process.env.LIGHTSPEED_CLIENT_ID
    ) {
      console.log(
        "⚠️  Missing LIGHTSPEED_ACCOUNT_ID or LIGHTSPEED_CLIENT_ID in .env file"
      );
      return;
    }

    // Create API instance with stored tokens
    const api = new LightspeedRetailSDK({
      accountID: process.env.LIGHTSPEED_ACCOUNT_ID,
      clientID: process.env.LIGHTSPEED_CLIENT_ID,
      clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET,
      refreshToken: process.env.LIGHTSPEED_REFRESH_TOKEN,
      tokenStorage: tokenStorage,
    });

    console.log("\n1. Checking stored token status...");
    const tokenInfo = await api.getTokenInfo();
    console.log("✅ Token info:", tokenInfo);

    console.log("\n2. Testing API connection...");
    const pingResult = await api.ping();
    console.log("✅ CommonJS ping result:", pingResult.status);

    console.log("\n3. Testing items endpoint...");
    const items = await api.getItems(null, 5);
    console.log(`✅ Retrieved ${items?.length || 0} items via CommonJS`);

    console.log("\n4. Testing account info...");
    const account = await api.getAccount();
    console.log("✅ Account loaded:", account?.Account?.name || "Success");

    console.log("\n🎉 All CommonJS tests passed!");
  } catch (error) {
    console.error("❌ CommonJS test failed:", error.message);

    if (error.message.includes("No refresh token available")) {
      console.log("\n💡 Troubleshooting:");
      console.log("1. Run the ES module test first: npm run test");
      console.log("2. Or add tokens to your .env file");
    }
  }
}

testCJS();
