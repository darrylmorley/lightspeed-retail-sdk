import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Base class for token storage
export class TokenStorage {
  async getTokens() {
    throw new Error("getTokens() must be implemented by subclass");
  }

  async setTokens(tokens) {
    throw new Error("setTokens() must be implemented by subclass");
  }
}

/**
 * @param {TokenStorage} storageAdapter - Any TokenStorage instance (e.g., FileTokenStorage)
 * @param {string} encryptionKey - 32-byte (256-bit) key as a hex string or Buffer
 */
export class EncryptedTokenStorage {
  constructor(storageAdapter, encryptionKey) {
    this.adapter = storageAdapter;
    // Accept hex string or Buffer
    if (typeof encryptionKey === "string") {
      this.key = Buffer.from(encryptionKey, "hex");
    } else {
      this.key = encryptionKey;
    }
    if (this.key.length !== 32) {
      throw new Error("Encryption key must be 32 bytes (256 bits)");
    }
    this.algorithm = "aes-256-gcm";
  }

  async getTokens() {
    const encrypted = await this.adapter.getTokens();

    // Backwards compatibility: if it's a plain object with access_token, return as-is
    if (encrypted && typeof encrypted === "object" && encrypted.access_token) {
      return encrypted;
    }

    // Otherwise, expect { iv, tag, data }
    if (
      encrypted &&
      typeof encrypted === "object" &&
      encrypted.iv &&
      encrypted.tag &&
      encrypted.data
    ) {
      try {
        const iv = Buffer.from(encrypted.iv, "hex");
        const tag = Buffer.from(encrypted.tag, "hex");
        const encryptedData = Buffer.from(encrypted.data, "hex");

        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encryptedData, undefined, "utf8");
        decrypted += decipher.final("utf8");
        return JSON.parse(decrypted);
      } catch (err) {
        throw new Error("Failed to decrypt tokens: " + err.message);
      }
    }

    // If file is empty or not recognized, return empty object
    return {};
  }

  async setTokens(tokens) {
    // Backwards compatibility: if tokens are already encrypted, just store as-is
    if (
      tokens &&
      typeof tokens === "object" &&
      tokens.iv &&
      tokens.tag &&
      tokens.data
    ) {
      return this.adapter.setTokens(tokens);
    }

    // Encrypt the tokens object
    const iv = crypto.randomBytes(12); // 96 bits for GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(JSON.stringify(tokens), "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = cipher.getAuthTag();

    const encryptedPayload = {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      data: encrypted.toString("hex"),
    };

    return this.adapter.setTokens(encryptedPayload);
  }
}

// In-memory storage (fallback)
export class InMemoryTokenStorage extends TokenStorage {
  constructor() {
    super();
    this.tokens = {};
    console.warn(
      "⚠️  WARNING: Using InMemoryTokenStorage - tokens will be lost on application restart.\n" +
        "   With Lightspeed's new OAuth system, refresh tokens are invalidated after each use.\n" +
        "   Consider implementing persistent storage (FileTokenStorage, database, etc.) for production use.\n" +
        "   See documentation: https://github.com/darrylmorley/lightspeed-retail-sdk"
    );
  }

  async getTokens() {
    return this.tokens;
  }

  async setTokens(tokens) {
    this.tokens = tokens;
  }
}

// File-based storage
export class FileTokenStorage extends TokenStorage {
  constructor(filePath) {
    super();
    this.filePath =
      filePath || path.join(process.cwd(), ".lightspeed-tokens.json");

    // Warn about production usage
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️  WARNING: FileTokenStorage is not recommended for production use."
      );
      console.warn(
        "   Consider using database storage, environment variables, or secure key management."
      );
      console.warn(
        "   See: https://github.com/darrylmorley/lightspeed-retail-sdk#production-token-storage"
      );
    }
  }

  async getTokens() {
    try {
      const data = await fs.readFile(this.filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  async setTokens(tokens) {
    await fs.writeFile(this.filePath, JSON.stringify(tokens, null, 2));
  }
}

// Database storage template
export class DatabaseTokenStorage extends TokenStorage {
  constructor(databaseConnection, options = {}) {
    super();
    this.db = databaseConnection;
    this.tableName = options.tableName || "oauth_tokens";
    this.appId = options.appId || "default";
  }

  async getTokens() {
    // Implementation depends on your database
    throw new Error(
      "DatabaseTokenStorage requires implementation for your specific database"
    );
  }

  async setTokens(tokens) {
    // Implementation depends on your database
    throw new Error(
      "DatabaseTokenStorage requires implementation for your specific database"
    );
  }
}
