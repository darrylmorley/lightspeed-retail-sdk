import { promises as fs } from "fs";
import path from "path";

// Base class for token storage
export class TokenStorage {
  async getTokens() {
    throw new Error("getTokens() must be implemented by subclass");
  }

  async setTokens(tokens) {
    throw new Error("setTokens() must be implemented by subclass");
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
