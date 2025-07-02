const LightspeedRetailSDK = require("../index.cjs");

async function testCJS() {
  console.log("📦 Testing CommonJS version\n");

  try {
    const api = new LightspeedRetailSDK({
      accountID: process.env.LIGHTSPEED_ACCOUNT_ID || "YOUR_ACCOUNT_ID",
      clientID: process.env.LIGHTSPEED_CLIENT_ID || "YOUR_CLIENT_ID",
      clientSecret:
        process.env.LIGHTSPEED_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
      refreshToken:
        process.env.LIGHTSPEED_REFRESH_TOKEN || "YOUR_REFRESH_TOKEN",
    });

    const pingResult = await api.ping();
    console.log("✅ CommonJS version works:", pingResult.status);
  } catch (error) {
    console.error("❌ CommonJS test failed:", error.message);
  }
}

testCJS();
