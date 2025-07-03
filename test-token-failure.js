#!/usr/bin/env node
import LightspeedRetailSDK from "./dist/index.mjs";
import { FileTokenStorage } from "./dist/src/storage/TokenStorage.mjs";
import dotenv from "dotenv";

dotenv.config();

async function testTokenFailure() {
  console.log("🧪 Testing real token refresh failure...");

  try {
    // Create SDK with invalid refresh token to force failure
    const sdk = new LightspeedRetailSDK({
      accountID: process.env.LIGHTSPEED_ACCOUNT_ID,
      clientID: process.env.LIGHTSPEED_CLIENT_ID,
      clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET,
      refreshToken: "invalid_refresh_token_to_force_failure",
      tokenStorage: new FileTokenStorage("./test-failure-tokens.json"),
    });

    // Try to make an API call - this will trigger token refresh failure
    console.log("📞 Making API call to trigger token refresh...");
    await sdk.getAccount();

    console.log("❓ Unexpected: API call succeeded (should have failed)");
  } catch (error) {
    console.log("✅ Expected: Token refresh failed");
    console.log("📧 Check your email for the failure notification!");
    console.log(`Error: ${error.message}`);
  }
}

testTokenFailure().catch(console.error);
