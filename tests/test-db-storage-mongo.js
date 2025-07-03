import { DatabaseTokenStorage } from "../dist/src/storage/TokenStorage.mjs";
import assert from "assert";
import dotenv from "dotenv";

dotenv.config();

// Set your test MongoDB connection string here or via env
const MONGO_URL = process.env.MONGO_URL;
const COLLECTION_NAME = "oauth_tokens";

async function runTests() {
  // Dynamic import for mongodb
  const { MongoClient } = (await import("mongodb")).default;
  const client = new MongoClient(MONGO_URL, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db();
  const collection = db.collection(COLLECTION_NAME);

  // Clean up any previous test doc
  await collection.deleteOne({ app_id: "testapp" });

  const storage = new DatabaseTokenStorage(MONGO_URL, {
    dbType: "mongodb",
    tableName: COLLECTION_NAME,
    appId: "testapp",
  });

  // Test: getTokens returns {} when empty
  let tokens = await storage.getTokens();
  assert.deepStrictEqual(
    tokens,
    {},
    "Should return empty object when no tokens stored"
  );

  // Test: setTokens and getTokens
  const testTokens = {
    access_token: "abc123",
    refresh_token: "def456",
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    expires_in: 3600,
  };
  await storage.setTokens(testTokens);
  tokens = await storage.getTokens();
  assert.strictEqual(
    tokens.access_token,
    testTokens.access_token,
    "Access token should match"
  );
  assert.strictEqual(
    tokens.refresh_token,
    testTokens.refresh_token,
    "Refresh token should match"
  );

  // Test: overwrite tokens
  const newTokens = { ...testTokens, access_token: "xyz789" };
  await storage.setTokens(newTokens);
  tokens = await storage.getTokens();
  assert.strictEqual(
    tokens.access_token,
    "xyz789",
    "Should overwrite access token"
  );

  // Clean up
  await collection.deleteOne({ app_id: "testapp" });
  await storage.close();
  await client.close();
  console.log("✅ DatabaseTokenStorage (MongoDB) tests passed.");
}

runTests().catch((err) => {
  console.error("❌ DatabaseTokenStorage (MongoDB) test failed:", err);
  process.exit(1);
});
