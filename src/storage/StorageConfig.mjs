import { promises as fs } from "fs";
import path from "path";

/**
 * Storage configuration manager that tracks which storage type and settings
 * are being used, enabling automatic storage discovery.
 */
export class StorageConfig {
  constructor(configPath = ".lightspeed-storage-config.json") {
    this.configPath = path.resolve(configPath);
  }

  /**
   * Save storage configuration for future auto-discovery
   * @param {Object} config - Storage configuration
   * @param {string} config.type - Storage type: 'file', 'encrypted-file', 'database'
   * @param {Object} config.settings - Storage-specific settings
   */
  async saveConfig(config) {
    try {
      const configData = {
        type: config.type,
        settings: config.settings,
        lastUpdated: new Date().toISOString(),
        version: "1.0"
      };

      await fs.writeFile(
        this.configPath,
        JSON.stringify(configData, null, 2),
        "utf8"
      );
    } catch (error) {
      console.warn(`Warning: Could not save storage config: ${error.message}`);
    }
  }

  /**
   * Load existing storage configuration
   * @returns {Object|null} Configuration object or null if not found
   */
  async loadConfig() {
    try {
      const data = await fs.readFile(this.configPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null; // Config file doesn't exist
      }
      console.warn(`Warning: Could not load storage config: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if storage configuration exists
   * @returns {boolean}
   */
  async hasConfig() {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove storage configuration
   */
  async removeConfig() {
    try {
      await fs.unlink(this.configPath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.warn(`Warning: Could not remove storage config: ${error.message}`);
      }
    }
  }
}

/**
 * Create a token storage instance based on saved configuration
 * @param {Object} config - Storage configuration from StorageConfig
 * @returns {TokenStorage} Configured storage instance
 */
export async function createStorageFromConfig(config) {
  const { 
    FileTokenStorage, 
    EncryptedTokenStorage, 
    DatabaseTokenStorage 
  } = await import("./TokenStorage.mjs");

  switch (config.type) {
    case "file": {
      return new FileTokenStorage(config.settings.filePath);
    }

    case "encrypted-file": {
      const fileStorage = new FileTokenStorage(config.settings.filePath);
      return new EncryptedTokenStorage(fileStorage, config.settings.encryptionKey);
    }

    case "database": {
      const dbStorage = new DatabaseTokenStorage(
        config.settings.connectionString,
        {
          dbType: config.settings.dbType,
          tableName: config.settings.tableName,
          appId: config.settings.appId
        }
      );
      
      if (config.settings.encrypted) {
        return new EncryptedTokenStorage(dbStorage, config.settings.encryptionKey);
      }
      
      return dbStorage;
    }

    default:
      throw new Error(`Unknown storage type: ${config.type}`);
  }
}

/**
 * Auto-discover and create the appropriate token storage based on
 * previously saved configuration, environment variables, or defaults.
 * @param {string} configPath - Optional path to config file
 * @returns {TokenStorage|null} Storage instance or null if none found
 */
export async function autoDiscoverStorage(configPath) {
  const storageConfig = new StorageConfig(configPath);
  
  // Try to load saved configuration first
  const config = await storageConfig.loadConfig();
  if (config) {
    try {
      return await createStorageFromConfig(config);
    } catch (error) {
      console.warn(`Warning: Could not create storage from saved config: ${error.message}`);
    }
  }

  // Fallback: Check for environment variables for common setups
  if (process.env.LIGHTSPEED_TOKEN_FILE) {
    const { FileTokenStorage, EncryptedTokenStorage } = await import("./TokenStorage.mjs");
    const fileStorage = new FileTokenStorage(process.env.LIGHTSPEED_TOKEN_FILE);
    
    if (process.env.LIGHTSPEED_ENCRYPTION_KEY) {
      return new EncryptedTokenStorage(fileStorage, process.env.LIGHTSPEED_ENCRYPTION_KEY);
    }
    
    return fileStorage;
  }

  // Check for default token file locations
  const defaultPaths = [
    ".lightspeed-tokens.json",
    "./tokens/encrypted-tokens.json",
    "./lightspeed-tokens.json"
  ];

  for (const defaultPath of defaultPaths) {
    try {
      await fs.access(defaultPath);
      const { FileTokenStorage } = await import("./TokenStorage.mjs");
      return new FileTokenStorage(defaultPath);
    } catch {
      // File doesn't exist, continue to next
    }
  }

  return null;
}