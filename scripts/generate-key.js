import crypto from "crypto";

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString("hex");
}

console.log("🔑 Generated encryption key:");
console.log(generateEncryptionKey());
console.log("\n📝 Add this to your .env file as:");
console.log("LIGHTSPEED_ENCRYPTION_KEY=<the-key-above>");
console.log(
  "\n⚠️  Keep this key secure and never commit it to version control!"
);
