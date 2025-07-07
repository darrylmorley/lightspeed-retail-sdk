// Quick test to verify EncryptedTokenStorage can be imported from CommonJS build
const { EncryptedTokenStorage, FileTokenStorage } = require("./dist/index.cjs");

console.log(
  "✅ EncryptedTokenStorage imported successfully:",
  typeof EncryptedTokenStorage
);
console.log(
  "✅ FileTokenStorage imported successfully:",
  typeof FileTokenStorage
);

// Test that we can create instances
const fileStorage = new FileTokenStorage("./test-tokens.json");
const encryptedStorage = new EncryptedTokenStorage(fileStorage, "a".repeat(64));

console.log("✅ FileTokenStorage instance created");
console.log("✅ EncryptedTokenStorage instance created");

console.log("🎉 All exports working correctly!");
