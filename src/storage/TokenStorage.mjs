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
        const helpMsg =
          "\n❌ Failed to decrypt tokens. This may be due to an incorrect or rotated encryption key, or a corrupted token file.\n" +
          "👉 Please check your encryption key or re-authenticate.\n" +
          "Original error: " +
          err.message;
        console.error(helpMsg);
        process.emitWarning(helpMsg, { code: "TOKEN_DECRYPTION_FAILED" });
        throw new Error(helpMsg);
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
      const helpMsg =
        "\n❌ Unable to read token file. Please check file permissions and available disk space.\n" +
        "File: " +
        this.filePath +
        "\n" +
        "Original error: " +
        error.message;
      console.error(helpMsg);
      process.emitWarning(helpMsg, { code: "TOKEN_FILE_READ_FAILED" });
      return {};
    }
  }

  async setTokens(tokens) {
    try {
      await fs.writeFile(
        this.filePath,
        JSON.stringify(tokens, null, 2),
        "utf8"
      );
    } catch (error) {
      const helpMsg =
        "\n❌ Unable to write token file. Please check file permissions and available disk space.\n" +
        "File: " +
        this.filePath +
        "\n" +
        "Original error: " +
        error.message;
      console.error(helpMsg);
      process.emitWarning(helpMsg, { code: "TOKEN_FILE_WRITE_FAILED" });
      throw new Error(helpMsg);
    }
  }
}

/**
 * Persistent token storage using a database backend.
 *
 * Supported dbType values: "postgres", "sqlite", "mongodb"
 *
 * @example
 * // PostgreSQL
 * const storage = new DatabaseTokenStorage("postgres://user:pass@host:5432/dbname", {
 *   dbType: "postgres",
 *   tableName: "oauth_tokens", // optional
 *   appId: "default" // optional
 * });
 *
 * // SQLite
 * const storage = new DatabaseTokenStorage("./tokens.sqlite", {
 *   dbType: "sqlite",
 *   tableName: "oauth_tokens", // optional
 *   appId: "default" // optional
 * });
 *
 * // MongoDB
 * const storage = new DatabaseTokenStorage("mongodb://localhost:27017/yourdb", {
 *   dbType: "mongodb",
 *   tableName: "oauth_tokens", // optional (collection name)
 *   appId: "default" // optional
 * });
 *
 * @param {string} databaseConnection - Connection string or file path for the database.
 * @param {Object} options
 * @param {"postgres"|"sqlite"|"mongodb"} options.dbType - Type of database backend.
 * @param {string} [options.tableName] - Table/collection name for storing tokens.
 * @param {string} [options.appId] - Application ID for multi-app support.
 */
export class DatabaseTokenStorage extends TokenStorage {
  constructor(databaseConnection, options = {}) {
    super();
    this.dbConnectionString = databaseConnection;
    this.tableName = options.tableName || "oauth_tokens";
    this.appId = options.appId || "default";
    this.dbType = options.dbType || "sqlite";
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    switch (this.dbType) {
      case "postgres": {
        const pg = await import("pg");
        this.pg = pg;
        this.client = new pg.Client(this.dbConnectionString);
        break;
      }
      case "sqlite": {
        const sqlite3mod = await import("sqlite3");
        this.sqlite3 = sqlite3mod.default.verbose();
        this.db = new this.sqlite3.Database(this.dbConnectionString, (err) => {
          if (err) {
            console.error("Error opening SQLite database:", err.message);
          }
        });
        break;
      }
      case "mongodb": {
        const mongodb = await import("mongodb");
        this.MongoClient = mongodb.MongoClient;
        this.mongoClient = new this.MongoClient(this.dbConnectionString, {
          useUnifiedTopology: true,
        });
        break;
      }
      default:
        throw new Error("Unsupported database type: " + this.dbType);
    }
    this._initialized = true;
  }

  async getTokens() {
    await this.init();
    switch (this.dbType) {
      case "postgres":
        try {
          await this.client.connect();
          const res = await this.client.query(
            `SELECT tokens FROM ${this.tableName} WHERE app_id = $1 LIMIT 1`,
            [this.appId]
          );
          await this.client.end();
          if (res.rows.length === 0) return {};
          return res.rows[0].tokens;
        } catch (error) {
          const helpMsg =
            "\n❌ Unable to read tokens from PostgreSQL database.\n" +
            "Original error: " +
            error.message;
          console.error(helpMsg);
          process.emitWarning(helpMsg, { code: "TOKEN_DB_READ_FAILED" });
          return {};
        }

      case "sqlite":
        return new Promise((resolve, reject) => {
          this.db.get(
            `SELECT tokens FROM ${this.tableName} WHERE app_id = ? LIMIT 1`,
            [this.appId],
            (err, row) => {
              if (err) {
                const helpMsg =
                  "\n❌ Unable to read tokens from SQLite database.\n" +
                  "Original error: " +
                  err.message;
                console.error(helpMsg);
                process.emitWarning(helpMsg, { code: "TOKEN_DB_READ_FAILED" });
                return resolve({});
              }
              if (!row) return resolve({});
              try {
                resolve(
                  typeof row.tokens === "string"
                    ? JSON.parse(row.tokens)
                    : row.tokens
                );
              } catch (parseErr) {
                const helpMsg =
                  "\n❌ Failed to parse tokens from SQLite database.\n" +
                  "Original error: " +
                  parseErr.message;
                console.error(helpMsg);
                process.emitWarning(helpMsg, { code: "TOKEN_DB_PARSE_FAILED" });
                resolve({});
              }
            }
          );
        });

      case "mongodb":
        try {
          await this.mongoClient.connect();
          const db = this.mongoClient.db();
          const collection = db.collection(this.tableName);
          const doc = await collection.findOne({ app_id: this.appId });
          await this.mongoClient.close();
          if (!doc || !doc.tokens) return {};
          return doc.tokens;
        } catch (error) {
          const helpMsg =
            "\n❌ Unable to read tokens from MongoDB.\n" +
            "Original error: " +
            error.message;
          console.error(helpMsg);
          process.emitWarning(helpMsg, { code: "TOKEN_DB_READ_FAILED" });
          return {};
        }

      default:
        throw new Error(
          "DatabaseTokenStorage requires implementation for your specific database"
        );
    }
  }

  async setTokens(tokens) {
    await this.init();
    switch (this.dbType) {
      case "postgres":
        try {
          await this.client.connect();
          await this.client.query(
            `INSERT INTO ${this.tableName} (app_id, tokens)
           VALUES ($1, $2)
           ON CONFLICT (app_id)
           DO UPDATE SET tokens = EXCLUDED.tokens`,
            [this.appId, tokens]
          );
          await this.client.end();
        } catch (error) {
          const helpMsg =
            "\n❌ Unable to write tokens to PostgreSQL database.\n" +
            "Original error: " +
            error.message;
          console.error(helpMsg);
          process.emitWarning(helpMsg, { code: "TOKEN_DB_WRITE_FAILED" });
          throw new Error(helpMsg);
        }
        return;

      case "sqlite":
        return new Promise((resolve, reject) => {
          this.db.run(
            `INSERT OR REPLACE INTO ${this.tableName} (app_id, tokens) VALUES (?, ?)`,
            [this.appId, JSON.stringify(tokens)],
            function (err) {
              if (err) {
                const helpMsg =
                  "\n❌ Unable to write tokens to SQLite database.\n" +
                  "Original error: " +
                  err.message;
                console.error(helpMsg);
                process.emitWarning(helpMsg, { code: "TOKEN_DB_WRITE_FAILED" });
                return reject(new Error(helpMsg));
              }
              resolve();
            }
          );
        });

      case "mongodb":
        try {
          await this.mongoClient.connect();
          const db = this.mongoClient.db();
          const collection = db.collection(this.tableName);
          await collection.updateOne(
            { app_id: this.appId },
            { $set: { tokens } },
            { upsert: true }
          );
          await this.mongoClient.close();
        } catch (error) {
          const helpMsg =
            "\n❌ Unable to write tokens to MongoDB.\n" +
            "Original error: " +
            error.message;
          console.error(helpMsg);
          process.emitWarning(helpMsg, { code: "TOKEN_DB_WRITE_FAILED" });
          throw new Error(helpMsg);
        }
        return;

      default:
        throw new Error(
          "DatabaseTokenStorage requires implementation for your specific database"
        );
    }
  }
}
