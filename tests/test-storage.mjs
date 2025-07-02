import { FileTokenStorage, InMemoryTokenStorage } from "../dist/index.mjs";

async function testTokenStorage() {
  console.log("🔒 Testing Token Storage Classes\n");

  // Test FileTokenStorage
  console.log("Testing FileTokenStorage...");
  const fileStorage = new FileTokenStorage("./tests/test-storage.json");

  const testTokens = {
    access_token: "test_access_token",
    refresh_token: "test_refresh_token",
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    expires_in: 3600,
  };

  try {
    await fileStorage.setTokens(testTokens);
    const retrievedTokens = await fileStorage.getTokens();
    console.log(
      "✅ FileTokenStorage works:",
      retrievedTokens.access_token === testTokens.access_token
    );
  } catch (error) {
    console.error("❌ FileTokenStorage failed:", error.message);
  }

  // Test InMemoryTokenStorage
  console.log("\nTesting InMemoryTokenStorage...");
  const memoryStorage = new InMemoryTokenStorage();

  try {
    await memoryStorage.setTokens(testTokens);
    const retrievedTokens = await memoryStorage.getTokens();
    console.log(
      "✅ InMemoryTokenStorage works:",
      retrievedTokens.access_token === testTokens.access_token
    );
  } catch (error) {
    console.error("❌ InMemoryTokenStorage failed:", error.message);
  }
}

testTokenStorage();
