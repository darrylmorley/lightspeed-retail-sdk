import { DatabaseTokenStorage } from "../dist/src/storage/TokenStorage.mjs";
import assert from "assert";
import fs from "fs";

const DB_PATH = "./tests/test-tokens.sqlite";
const TABLE_NAME = "oauth_tokens";

async function setupSqliteTable(dbPath, tableName) {
  const sqlite3 = (await import("sqlite3")).default.verbose();
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS ${tableName} (
        app_id TEXT PRIMARY KEY,
        tokens TEXT NOT NULL
      )`,
      (err) => {
        if (err) reject(err);
        else resolve(db);
      }
    );
  });
}

async function runTests() {
  // Clean up any previous test DB
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  await setupSqliteTable(DB_PATH, TABLE_NAME);

  const storage = new DatabaseTokenStorage(DB_PATH, {
    dbType: "sqlite",
    tableName: TABLE_NAME,
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
  await storage.close();
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  console.log("✅ DatabaseTokenStorage (SQLite) tests passed.");
}

runTests().catch((err) => {
  console.error("❌ DatabaseTokenStorage (SQLite) test failed:", err);
  process.exit(1);
});
