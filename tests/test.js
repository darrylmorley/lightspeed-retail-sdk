import LightspeedRetailSDK, { FileTokenStorage } from "../dist/index.mjs";
import { EncryptedTokenStorage } from "../dist/src/storage/TokenStorage.mjs";
import dotenv from "dotenv";

dotenv.config();

async function testSDK() {
  console.log("🚀 Testing Lightspeed Retail SDK v4.0.0\n");

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
        console.log("⚠️  No credentials found - skipping API tests");
        console.log(
          "Please add tokens to your .env file from your initial OAuth response"
        );
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

    // Test 1: Check token info first
    console.log("\n1. Checking token status...");
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
    const items = await api.getItems(null, 10);
    console.log(`✅ Retrieved ${items?.length || 0} items`);

    // Test 5: Test token refresh (only if needed)
    console.log("\n5. Testing token refresh...");
    const refreshResult = await api.refreshTokens();
    console.log(
      "✅ Token refresh:",
      refreshResult.success ? "Success" : "Failed"
    );

    console.log("\n🎉 All tests passed!");
    console.log(
      "💾 Your tokens are stored in ./live-tokens.json for future use"
    );
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
