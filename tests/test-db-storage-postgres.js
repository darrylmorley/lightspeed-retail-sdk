import { DatabaseTokenStorage } from "../dist/src/storage/TokenStorage.mjs";
import assert from "assert";
import dotenv from "dotenv";

dotenv.config();

// Set your test Postgres connection string here or via env
const PG_CONN = process.env.POSTGRES_URL;
const TABLE_NAME = "oauth_tokens";

async function setupPostgresTable(client, tableName) {
  await client.query(`CREATE TABLE IF NOT EXISTS ${tableName} (
    app_id TEXT PRIMARY KEY,
    tokens JSONB NOT NULL
  )`);
}

async function runTests() {
  // Dynamic import for pg
  const { Client } = (await import("pg")).default;
  const client = new Client({ connectionString: PG_CONN });
  await client.connect();
  await setupPostgresTable(client, TABLE_NAME);

  const storage = new DatabaseTokenStorage(PG_CONN, {
    dbType: "postgres",
    tableName: TABLE_NAME,
    appId: "testapp",
  });

  // Clean up any previous test row
  await client.query(`DELETE FROM ${TABLE_NAME} WHERE app_id = $1`, [
    "testapp",
  ]);

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
  await client.query(`DELETE FROM ${TABLE_NAME} WHERE app_id = $1`, [
    "testapp",
  ]);
  await storage.close();
  await client.end();
  console.log("✅ DatabaseTokenStorage (Postgres) tests passed.");
}

runTests().catch((err) => {
  console.error("❌ DatabaseTokenStorage (Postgres) test failed:", err);
  process.exit(1);
});
