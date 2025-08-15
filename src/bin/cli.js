#!/usr/bin/env node
import { Command } from "commander";
import open from "open";
import dotenv from "dotenv";
import {
  FileTokenStorage,
  EncryptedTokenStorage,
} from "../storage/TokenStorage.mjs";
import LightspeedRetailSDK from "../../index.mjs";
import inquirer from "inquirer";
import { createInterface } from "readline";
import axios from "axios";

dotenv.config();

// Simple prompt function for readline input
async function prompt(message) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Helper function to clean up database connections
async function cleanupStorageBackend(backend) {
  if (!backend) return;

  try {
    // Check if it's an EncryptedTokenStorage wrapping a DatabaseTokenStorage
    if (backend.adapter && typeof backend.adapter.close === "function") {
      await backend.adapter.close();
    }
    // Check if it's a direct DatabaseTokenStorage
    else if (typeof backend.close === "function") {
      await backend.close();
    }
  } catch (err) {
    // Ignore cleanup errors, just log them
    console.warn("Warning: Failed to cleanup storage backend:", err.message);
  }
}

const program = new Command();

program
  .name("lightspeed-retail-sdk")
  .description("Lightspeed Retail SDK CLI")
  .version("3.1.0");

program
  .command("login")
  .description("Authenticate and store new tokens")
  .option(
    "-b, --browser <browser>",
    "Specify browser to use (chrome, firefox, safari, edge, etc.)"
  )
  .option(
    "--no-browser",
    "Skip browser opening and display URL for manual access (useful in production/headless environments)"
  )
  .action(async (options) => {
    let storageBackend = null;
    try {
      // 1. Gather clientID, clientSecret, etc. from env or prompt
      const clientID =
        process.env.LIGHTSPEED_CLIENT_ID ||
        (await prompt("Enter your Lightspeed Client ID: "));
      const clientSecret =
        process.env.LIGHTSPEED_CLIENT_SECRET ||
        (await prompt("Enter your Lightspeed Client Secret: "));
      const redirectUri =
        process.env.LIGHTSPEED_REDIRECT_URI ||
        process.env.LIGHTSPEED_REDIRECT_URL ||
        (await prompt(
          "Enter your Redirect URI (must match your app settings): "
        ));
      const scopes =
        process.env.LIGHTSPEED_SCOPES ||
        (await prompt(
          "Enter scopes (space-separated, default: employee:all): "
        )) ||
        "employee:all";

      // 2. Build OAuth URL
      const authUrl = `https://cloud.lightspeedapp.com/auth/oauth/authorize?response_type=code&client_id=${encodeURIComponent(
        clientID
      )}&scope=${encodeURIComponent(scopes)}`;

      // Detect if we're in a headless/production environment
      const isHeadless = !process.env.DISPLAY && !process.env.SSH_CLIENT && process.platform !== 'darwin' && process.platform !== 'win32';
      const skipBrowser = options.noBrowser || isHeadless;

      if (skipBrowser) {
        console.log("\n🔗 OAuth Authentication Required");
        console.log("\nPlease open the following URL in your browser to authorize the application:");
        console.log(`\n${authUrl}\n`);
        console.log("After authorizing, you will be redirected to your configured redirect URI");
        console.log("with an authorization code in the URL (e.g., ?code=abc123...)");
      } else {
        console.log("\nOpening browser for authentication...");

        // Open browser with optional browser specification
        const openOptions = {};
        if (options.browser) {
          openOptions.app = { name: options.browser };
          console.log(`Using browser: ${options.browser}`);
        } else {
          // Ask user if they want to choose a specific browser
          const { chooseBrowser } = await inquirer.prompt([
            {
              type: "confirm",
              name: "chooseBrowser",
              message: "Do you want to choose a specific browser?",
              default: false,
            },
          ]);

          if (chooseBrowser) {
            const { browserChoice } = await inquirer.prompt([
              {
                type: "list",
                name: "browserChoice",
                message: "Select browser:",
                choices: [
                  { name: "Default browser", value: null },
                  { name: "Google Chrome", value: "google chrome" },
                  { name: "Firefox", value: "firefox" },
                  { name: "Safari", value: "safari" },
                  { name: "Microsoft Edge", value: "microsoft edge" },
                  { name: "Brave", value: "brave" },
                  { name: "Opera", value: "opera" },
                  { name: "Custom browser name", value: "custom" },
                ],
              },
            ]);

            if (browserChoice === "custom") {
              const { customBrowser } = await inquirer.prompt([
                {
                  type: "input",
                  name: "customBrowser",
                  message: "Enter browser name:",
                  validate: (input) =>
                    input.trim() !== "" || "Browser name cannot be empty",
                },
              ]);
              openOptions.app = { name: customBrowser };
              console.log(`Using browser: ${customBrowser}`);
            } else if (browserChoice) {
              openOptions.app = { name: browserChoice };
              console.log(`Using browser: ${browserChoice}`);
            }
          }
        }

        try {
          await open(authUrl, openOptions);
          console.log(`\nIf the browser didn't open, manually visit: ${authUrl}`);
        } catch (err) {
          console.log(
            `\n⚠️  Could not open browser automatically: ${err.message}`
          );
          console.log(`\nPlease manually open this URL in your browser:`);
          console.log(`\n${authUrl}\n`);
        }
      }

      // 3. Prompt for code
      const code = await prompt(
        "\nPaste the code from the redirected URL (code=...): "
      );

      // 4. Exchange code for tokens
      try {
        const tokenUrl = "https://cloud.lightspeedapp.com/auth/oauth/token";
        const response = await axios.post(
          tokenUrl,
          {
            grant_type: "authorization_code",
            client_id: clientID,
            client_secret: clientSecret,
            code,
          },
          { headers: { "Content-Type": "application/json" } }
        );

        const tokenData = response.data;
        const expiresAt = new Date(
          Date.now() + tokenData.expires_in * 1000
        ).toISOString();

        // 5. Store tokens using storage backend
        storageBackend = await selectStorageBackend();
        await storageBackend.setTokens({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          expires_in: tokenData.expires_in,
        });

        console.log("\n✅ Tokens acquired and stored successfully!");
      } catch (err) {
        console.error(
          "\n❌ Failed to exchange code for tokens. Please check your credentials and try again."
        );
        if (err.response && err.response.data) {
          console.error("API Error:", err.response.data);
        } else {
          console.error(err.message);
        }
        process.exit(1);
      }
    } finally {
      await cleanupStorageBackend(storageBackend);
    }
  });

program
  .command("token-status")
  .description("Show current token status")
  .action(async () => {
    let storageBackend = null;
    try {
      storageBackend = await selectStorageBackend();
      const tokens = await storageBackend.getTokens();
      if (!tokens || !tokens.access_token) {
        console.log("\n⚠️  No tokens found in storage.");
        return;
      }
      console.log("\n🔑 Current token status:");
      console.log("  Access Token:", tokens.access_token);
      console.log("  Refresh Token:", tokens.refresh_token);
      if (tokens.expires_at) {
        const expires = new Date(tokens.expires_at);
        const now = new Date();
        const mins = Math.round((expires - now) / 60000);
        console.log("  Expires At:", tokens.expires_at, `(in ${mins} min)`);
      }
      if (tokens.expires_in) {
        console.log("  Expires In:", tokens.expires_in, "seconds");
      }
    } finally {
      await cleanupStorageBackend(storageBackend);
    }
  });

program
  .command("reset")
  .description(
    "Clear stored tokens from your selected backend (file, encrypted file, or database)"
  )
  .action(async () => {
    // Prompt for backend type
    const { storageType } = await inquirer.prompt([
      {
        type: "list",
        name: "storageType",
        message: "Select your token storage backend:",
        choices: [
          { name: "File", value: "file" },
          { name: "Encrypted File", value: "encryptedFile" },
          { name: "Database (SQLite, Postgres, MongoDB)", value: "database" },
        ],
        default: process.env.LIGHTSPEED_ENCRYPTION_KEY
          ? "encryptedFile"
          : "file",
      },
    ]);

    if (storageType === "database") {
      // Prompt for DB type
      const { dbType } = await inquirer.prompt([
        {
          type: "list",
          name: "dbType",
          message: "Select your database type:",
          choices: [
            { name: "SQLite", value: "sqlite" },
            { name: "Postgres", value: "postgres" },
            { name: "MongoDB", value: "mongodb" },
          ],
        },
      ]);
      let conn, table;
      switch (dbType) {
        case "sqlite": {
          const { sqlitePath } = await inquirer.prompt([
            {
              type: "input",
              name: "sqlitePath",
              message: "Enter SQLite file path:",
              default: "./tokens.sqlite",
            },
          ]);
          conn = sqlitePath;
          const { tableName } = await inquirer.prompt([
            {
              type: "input",
              name: "tableName",
              message: "Enter table name:",
              default: "oauth_tokens",
            },
          ]);
          table = tableName;
          // Delete all rows from table
          try {
            const sqlite3 = (await import("sqlite3")).default.verbose();
            const db = new sqlite3.Database(conn);
            await new Promise((resolve, reject) => {
              db.run(`DELETE FROM ${table}`, (err) =>
                err ? reject(err) : resolve()
              );
            });
            db.close();
            console.log(
              `\n✅ All tokens cleared from SQLite table '${table}' in ${conn}`
            );
          } catch (err) {
            console.error(
              "\n❌ Failed to clear tokens from SQLite:",
              err.message
            );
          }
          return;
        }
        case "postgres": {
          const { pgConn } = await inquirer.prompt([
            {
              type: "input",
              name: "pgConn",
              message: "Enter Postgres connection string:",
            },
          ]);
          conn = pgConn;
          const { tableName } = await inquirer.prompt([
            {
              type: "input",
              name: "tableName",
              message: "Enter table name:",
              default: "oauth_tokens",
            },
          ]);
          table = tableName;
          try {
            const { Client } = (await import("pg")).default;
            const client = new Client({ connectionString: conn });
            await client.connect();
            await client.query(`DELETE FROM ${table}`);
            await client.end();
            console.log(
              `\n✅ All tokens cleared from Postgres table '${table}' in ${conn}`
            );
          } catch (err) {
            console.error(
              "\n❌ Failed to clear tokens from Postgres:",
              err.message
            );
          }
          return;
        }
        case "mongodb": {
          const { mongoConn } = await inquirer.prompt([
            {
              type: "input",
              name: "mongoConn",
              message: "Enter MongoDB connection string:",
            },
          ]);
          conn = mongoConn;
          const { collectionName } = await inquirer.prompt([
            {
              type: "input",
              name: "collectionName",
              message: "Enter collection name:",
              default: "oauth_tokens",
            },
          ]);
          table = collectionName;
          try {
            const { MongoClient } = (await import("mongodb")).default;
            const client = new MongoClient(conn, { useUnifiedTopology: true });
            await client.connect();
            const db = client.db();
            const collection = db.collection(table);
            await collection.deleteMany({});
            await client.close();
            console.log(
              `\n✅ All tokens cleared from MongoDB collection '${table}' in ${conn}`
            );
          } catch (err) {
            console.error(
              "\n❌ Failed to clear tokens from MongoDB:",
              err.message
            );
          }
          return;
        }
        default:
          console.error("Unsupported database type.");
          return;
      }
    }

    // File or Encrypted File
    // Determine token file path
    let tokenFile = process.env.LIGHTSPEED_TOKEN_FILE;
    if (!tokenFile) {
      const { tokenPath } = await inquirer.prompt([
        {
          type: "input",
          name: "tokenPath",
          message: "Enter token file path:",
          default: "./tokens/encrypted-tokens.json",
        },
      ]);
      tokenFile = tokenPath;
    }
    const fileStorage = new FileTokenStorage(tokenFile);
    if (storageType === "encryptedFile") {
      const encryptionKey =
        process.env.LIGHTSPEED_ENCRYPTION_KEY ||
        (await prompt("Enter your 64-char encryption key: "));
      const encryptedStorage = new EncryptedTokenStorage(
        fileStorage,
        encryptionKey
      );
      await encryptedStorage.setTokens({});
      console.log(`\n✅ Encrypted token file cleared: ${tokenFile}`);
    } else {
      await fileStorage.setTokens({});
      console.log(`\n✅ Token file cleared: ${tokenFile}`);
    }
  });

program
  .command("inject-tokens")
  .description("Manually store an access & refresh token in chosen backend")
  .option("--access <accessToken>", "Access token (skip interactive prompt)")
  .option("--refresh <refreshToken>", "Refresh token (skip interactive prompt)")
  .option(
    "--expires-at <isoDatetime>",
    "ISO8601 expiry (e.g. 2025-01-01T12:34:56.000Z). Overrides --expires-in."
  )
  .option(
    "--expires-in <seconds>",
    "Seconds until expiry (default 3600 if neither --expires-at nor --expires-in provided)"
  )
  .action(async (opts) => {
    let storageBackend = null;
    try {
      console.log("\n🔑 Manual Token Injection\n");
      console.log("This command allows you to manually store access and refresh tokens");
      console.log("that you've obtained through other means (e.g., Lightspeed dashboard).\n");

      // Get tokens either from command line options or interactive prompts
      let accessToken = opts.access;
      let refreshToken = opts.refresh;

      if (!accessToken) {
        accessToken = await prompt("Enter your access token: ");
        if (!accessToken || accessToken.trim() === "") {
          console.error("❌ Access token is required");
          process.exit(1);
        }
        accessToken = accessToken.trim();
      }

      if (!refreshToken) {
        refreshToken = await prompt("Enter your refresh token: ");
        if (!refreshToken || refreshToken.trim() === "") {
          console.error("❌ Refresh token is required");
          process.exit(1);
        }
        refreshToken = refreshToken.trim();
      }

      // Get expiry information
      let expiresAt;
      if (opts.expiresAt) {
        const d = new Date(opts.expiresAt);
        if (isNaN(d.getTime())) {
          console.error("❌ Invalid --expires-at value");
          process.exit(1);
        }
        expiresAt = d.toISOString();
      } else if (opts.expiresIn) {
        const seconds = parseInt(opts.expiresIn, 10);
        if (isNaN(seconds) || seconds <= 0) {
          console.error("❌ Invalid --expires-in value");
          process.exit(1);
        }
        expiresAt = new Date(Date.now() + seconds * 1000).toISOString();
      } else {
        // Interactive prompt for expiry
        const expiryChoice = await inquirer.prompt([
          {
            type: "list",
            name: "expiryMethod",
            message: "How would you like to set the token expiry?",
            choices: [
              { name: "Default (1 hour from now)", value: "default" },
              { name: "Specific date/time (ISO format)", value: "datetime" },
              { name: "Seconds from now", value: "seconds" },
            ],
            default: "default",
          },
        ]);

        switch (expiryChoice.expiryMethod) {
          case "default":
            expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
            break;
          case "datetime":
            const { customDateTime } = await inquirer.prompt([
              {
                type: "input",
                name: "customDateTime",
                message: "Enter expiry date/time (ISO format, e.g., 2025-01-01T12:34:56.000Z):",
                validate: (input) => {
                  const d = new Date(input);
                  return !isNaN(d.getTime()) || "Please enter a valid ISO datetime";
                },
              },
            ]);
            expiresAt = new Date(customDateTime).toISOString();
            break;
          case "seconds":
            const { customSeconds } = await inquirer.prompt([
              {
                type: "input",
                name: "customSeconds",
                message: "Enter seconds until expiry:",
                default: "3600",
                validate: (input) => {
                  const num = parseInt(input, 10);
                  return (!isNaN(num) && num > 0) || "Please enter a positive number";
                },
              },
            ]);
            expiresAt = new Date(Date.now() + parseInt(customSeconds, 10) * 1000).toISOString();
            break;
        }
      }

      console.log("\n📁 Token Storage Configuration");
      storageBackend = await selectStorageBackend();

      // Validate tokens format (basic check)
      if (accessToken.length < 10) {
        console.warn("⚠️  Warning: Access token seems unusually short");
      }
      if (refreshToken.length < 10) {
        console.warn("⚠️  Warning: Refresh token seems unusually short");
      }

      await storageBackend.setTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        expires_in: Math.floor((new Date(expiresAt) - new Date()) / 1000),
      });

      console.log("\n✅ Tokens injected successfully!");
      console.log("📋 Token Details:");
      console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${refreshToken.substring(0, 20)}...`);
      console.log(`   Expires At: ${expiresAt}`);
      
      const minutesUntilExpiry = Math.floor((new Date(expiresAt) - new Date()) / 60000);
      console.log(`   Time Until Expiry: ${minutesUntilExpiry} minutes`);

      console.log("\n💡 You can now use the SDK with these tokens.");
      console.log("   Test with: npm run cli whoami");
    } catch (err) {
      console.error("❌ Failed to inject tokens:", err.message);
      process.exit(1);
    } finally {
      await cleanupStorageBackend(storageBackend);
    }
  });

program
  .command("migrate-tokens")
  .description(
    "Copy tokens from one storage backend to another (file, encrypted file, or database)"
  )
  .action(async () => {
    let sourceBackend = null;
    let destBackend = null;

    try {
      console.log("\n🔄 Token Storage Migration Wizard\n");
      // Prompt for source backend
      console.log("Select SOURCE storage backend:");
      sourceBackend = await selectStorageBackend();
      const sourceTokens = await sourceBackend.getTokens();
      if (!sourceTokens || !sourceTokens.access_token) {
        console.error("\n❌ No tokens found in source storage. Aborting.");
        return;
      }
      console.log("\n✅ Tokens loaded from source:");
      console.log(sourceTokens);

      // Prompt for destination backend
      console.log("\nSelect DESTINATION storage backend:");
      destBackend = await selectStorageBackend();

      // Attempt to create table/collection/file if it doesn't exist (best effort)
      switch (destBackend.constructor.name) {
        case "FileTokenStorage": {
          const fs = await import("fs");
          if (!fs.existsSync(destBackend.filePath)) {
            try {
              await fs.promises.writeFile(destBackend.filePath, "{}", "utf8");
              console.log(`Created token file: ${destBackend.filePath}`);
            } catch (err) {
              console.error(
                `Failed to create token file: ${destBackend.filePath}`,
                err.message
              );
            }
          }
          break;
        }
        case "DatabaseTokenStorage":
        case "EncryptedTokenStorage": {
          // DatabaseTokenStorage is now always wrapped in EncryptedTokenStorage
          // Check if the underlying storage is database or file-based
          const isDatabase =
            destBackend.adapter &&
            destBackend.adapter.constructor.name === "DatabaseTokenStorage";
          if (isDatabase) {
            // Try to create table/collection if not exists
            try {
              await destBackend.adapter.init();
              switch (destBackend.adapter.dbType) {
                case "sqlite": {
                  await new Promise((resolve, reject) => {
                    destBackend.adapter.db.run(
                      `CREATE TABLE IF NOT EXISTS ${destBackend.adapter.tableName} (app_id TEXT PRIMARY KEY, tokens TEXT NOT NULL)`,
                      (err) => (err ? reject(err) : resolve())
                    );
                  });
                  console.log(
                    `Ensured SQLite table '${destBackend.adapter.tableName}' exists.`
                  );
                  break;
                }
                case "postgres": {
                  await destBackend.adapter.client.query(
                    `CREATE TABLE IF NOT EXISTS ${destBackend.adapter.tableName} (app_id TEXT PRIMARY KEY, tokens JSONB NOT NULL)`
                  );
                  console.log(
                    `Ensured Postgres table '${destBackend.adapter.tableName}' exists.`
                  );
                  break;
                }
                case "mongodb": {
                  const db = destBackend.adapter.mongoClient.db();
                  const collection = db.collection(
                    destBackend.adapter.tableName
                  );
                  await collection.createIndex({ app_id: 1 }, { unique: true });
                  console.log(
                    `Ensured MongoDB collection '${destBackend.adapter.tableName}' exists (with unique index on app_id).`
                  );
                  break;
                }
              }
            } catch (err) {
              console.error(
                "Failed to ensure destination DB table/collection exists:",
                err.message
              );
            }
          } else {
            // File-based encrypted storage
            const fs = await import("fs");
            if (!fs.existsSync(destBackend.adapter.filePath)) {
              try {
                await fs.promises.writeFile(
                  destBackend.adapter.filePath,
                  "{}",
                  "utf8"
                );
                console.log(
                  `Created encrypted token file: ${destBackend.adapter.filePath}`
                );
              } catch (err) {
                console.error(
                  `Failed to create encrypted token file: ${destBackend.adapter.filePath}`,
                  err.message
                );
              }
            }
          }
          break;
        }
        default:
          // No action needed for unknown types
          break;
      }

      // Confirm overwrite if destination already has tokens
      const destTokens = await destBackend.getTokens();
      if (destTokens && destTokens.access_token) {
        const { confirm } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: "Destination already has tokens. Overwrite?",
            default: false,
          },
        ]);
        if (!confirm) {
          console.log("\n❌ Migration cancelled by user.");
          return;
        }
      }
      await destBackend.setTokens(sourceTokens);
      console.log("\n🎉 Tokens migrated successfully!");
    } catch (error) {
      console.error("\n❌ Migration failed:", error.message);
    } finally {
      // Clean up database connections
      await cleanupStorageBackend(sourceBackend);
      await cleanupStorageBackend(destBackend);
    }
  });

program
  .command("whoami")
  .description("Show account info for current token")
  .action(async () => {
    let storageBackend = null;
    try {
      storageBackend = await selectStorageBackend();
      const tokens = await storageBackend.getTokens();
      if (!tokens || !tokens.access_token) {
        console.log("\n⚠️  No tokens found in storage. Please login first.");
        return;
      }
      try {
        const sdk = new LightspeedRetailSDK({
          accountID: process.env.LIGHTSPEED_ACCOUNT_ID,
          clientID: process.env.LIGHTSPEED_CLIENT_ID,
          clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET,
          refreshToken: tokens.refresh_token,
          tokenStorage: storageBackend,
        });
        const info = await sdk.getAccount();
        const account = info?.Account || info?.data || info;
        if (account && account.name) {
          console.log("\n👤 Account Info:");
          console.log("  Name:", account.name);
          if (account.accountID) console.log("  ID:", account.accountID);
          if (account.status) console.log("  Status:", account.status);
          if (account.employeeCount)
            console.log("  Employees:", account.employeeCount);
          if (account.employeeLimit)
            console.log("  Employee Limit:", account.employeeLimit);
          if (account.defaultCurrency) {
            console.log(
              "  Default Currency:",
              `${account.defaultCurrency.code} (${account.defaultCurrency.symbol})`
            );
          }
          if (account.purchasingCurrencies) {
            const pcs = Array.isArray(
              account.purchasingCurrencies.purchasingCurrency
            )
              ? account.purchasingCurrencies.purchasingCurrency
              : [account.purchasingCurrencies.purchasingCurrency];
            if (pcs.length > 0) {
              console.log("  Purchasing Currencies:");
              pcs.forEach((cur) => {
                if (cur && cur.code) {
                  console.log(
                    `    - ${cur.code} (${cur.symbol}) Rate: ${cur.rate}`
                  );
                }
              });
            }
          }
        } else {
          console.log(
            "\n⚠️  Could not fetch account info. Check your tokens and credentials."
          );
        }
      } catch (err) {
        console.error("\n❌ Failed to fetch account info:", err.message);
      }
    } finally {
      await cleanupStorageBackend(storageBackend);
    }
  });

program
  .command("setup-db")
  .description(
    "Interactively create the required table/collection for your token storage backend"
  )
  .action(async () => {
    const { dbType } = await inquirer.prompt([
      {
        type: "list",
        name: "dbType",
        message: "Select your database type:",
        choices: [
          { name: "SQLite", value: "sqlite" },
          { name: "Postgres", value: "postgres" },
          { name: "MongoDB", value: "mongodb" },
        ],
      },
    ]);

    let conn;
    switch (dbType) {
      case "sqlite": {
        const { sqlitePath } = await inquirer.prompt([
          {
            type: "input",
            name: "sqlitePath",
            message: "Enter SQLite file path:",
            default: "./tokens.sqlite",
          },
        ]);
        conn = sqlitePath;
        break;
      }
      case "postgres": {
        const { pgConn } = await inquirer.prompt([
          {
            type: "input",
            name: "pgConn",
            message: "Enter Postgres connection string:",
          },
        ]);
        conn = pgConn;
        break;
      }
      case "mongodb": {
        const { mongoConn } = await inquirer.prompt([
          {
            type: "input",
            name: "mongoConn",
            message: "Enter MongoDB connection string:",
          },
        ]);
        conn = mongoConn;
        break;
      }
      default:
        throw new Error("Unsupported dbType");
    }

    const { table } = await inquirer.prompt([
      {
        type: "input",
        name: "table",
        message:
          dbType === "mongodb" ? "Enter collection name:" : "Enter table name:",
        default: "oauth_tokens",
      },
    ]);

    try {
      if (dbType === "sqlite") {
        const sqlite3 = (await import("sqlite3")).default.verbose();
        const db = new sqlite3.Database(conn);
        await new Promise((resolve, reject) => {
          db.run(
            `CREATE TABLE IF NOT EXISTS ${table} (app_id TEXT PRIMARY KEY, tokens TEXT NOT NULL)`,
            (err) => (err ? reject(err) : resolve())
          );
        });
        db.close();
        console.log(
          `\n✅ SQLite table '${table}' created or already exists in ${conn}`
        );
      } else if (dbType === "postgres") {
        const { Client } = (await import("pg")).default;
        const client = new Client({ connectionString: conn });
        await client.connect();
        await client.query(
          `CREATE TABLE IF NOT EXISTS ${table} (app_id TEXT PRIMARY KEY, tokens JSONB NOT NULL)`
        );
        await client.end();
        console.log(
          `\n✅ Postgres table '${table}' created or already exists in ${conn}`
        );
      } else if (dbType === "mongodb") {
        const { MongoClient } = (await import("mongodb")).default;
        const client = new MongoClient(conn, { useUnifiedTopology: true });
        await client.connect();
        const db = client.db();
        const collection = db.collection(table);
        await collection.createIndex({ app_id: 1 }, { unique: true });
        await client.close();
        console.log(
          `\n✅ MongoDB collection '${table}' created (with unique index on app_id) in ${conn}`
        );
      } else {
        throw new Error(
          "Unsupported dbtype. Use sqlite, postgres, or mongodb."
        );
      }
    } catch (err) {
      console.error("\n❌ Failed to set up database:", err.message);
      process.exit(1);
    }
  });

program
  .command("test-email")
  .description("Test email notification for token refresh failures")
  .option(
    "-a, --account-id <accountId>",
    "Account ID to use in test email",
    "TEST-ACCOUNT"
  )
  .action(async (options) => {
    try {
      console.log(
        "🧪 Testing email notification for token refresh failure...\n"
      );

      // Check if SMTP configuration is available
      if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.ALERT_EMAIL
      ) {
        console.error("❌ Email test failed: SMTP configuration not found");
        console.log("\n💡 Required environment variables:");
        console.log("   - SMTP_HOST");
        console.log("   - SMTP_USER");
        console.log("   - SMTP_PASS");
        console.log("   - ALERT_EMAIL");
        console.log("   - SMTP_PORT (optional, defaults to 587)");
        console.log("   - SMTP_SECURE (optional, defaults to false)");
        console.log("   - SMTP_FROM (optional, defaults to SMTP_USER)");
        console.log("\n📝 See README.md for SMTP configuration examples");
        process.exit(1);
      }

      console.log("📧 SMTP Configuration found:");
      console.log(`   Host: ${process.env.SMTP_HOST}`);
      console.log(`   Port: ${process.env.SMTP_PORT || "587"}`);
      console.log(`   User: ${process.env.SMTP_USER}`);
      console.log(`   Alert Email: ${process.env.ALERT_EMAIL}`);
      console.log(
        `   Secure: ${process.env.SMTP_SECURE === "true" ? "Yes" : "No"}`
      );

      // Create a test error to simulate token refresh failure
      const testError = new Error(
        "Simulated token refresh failure for testing"
      );
      testError.status = 401;
      testError.code = "TOKEN_REFRESH_FAILED";

      // Import the email function from the SDK
      // Since the email function is internal, we'll implement our own test version
      console.log("\n📤 Attempting to send test email...");

      // Call our test email function
      await sendTestTokenRefreshFailureEmail(testError, options.accountId);

      console.log("\n✅ Email test completed!");
      console.log("\n💡 Check your email inbox for the test notification.");
      console.log("   If you don't receive the email, check:");
      console.log("   - SMTP configuration");
      console.log("   - Spam/junk folder");
      console.log("   - Email server logs");
    } catch (error) {
      console.error("\n❌ Email test failed:", error.message);
      if (error.code === "EAUTH") {
        console.log(
          "\n💡 Authentication failed - check SMTP_USER and SMTP_PASS"
        );
      } else if (error.code === "ECONNECTION" || error.code === "ENOTFOUND") {
        console.log("\n💡 Connection failed - check SMTP_HOST and SMTP_PORT");
      } else if (error.code === "EMESSAGE") {
        console.log("\n💡 Message rejected - check ALERT_EMAIL address");
      }
      process.exit(1);
    }
  });

// Test email function (mirrors the SDK implementation)
async function sendTestTokenRefreshFailureEmail(error, accountID) {
  try {
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ALERT_EMAIL,
      subject: `🧪 TEST: Lightspeed SDK Token Refresh Failed - Account ${accountID}`,
      html: `
        <h2>🧪 TEST: Lightspeed SDK Alert</h2>
        <p><strong>This is a test email for token refresh failure notifications.</strong></p>
        
        <h3>Test Details:</h3>
        <ul>
          <li><strong>Account ID:</strong> ${accountID}</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
          <li><strong>Simulated Error:</strong> ${error.message}</li>
          <li><strong>Test Status:</strong> ✅ Email system working correctly</li>
        </ul>

        <h3>What this means:</h3>
        <p>Your email notification system is properly configured! In a real scenario, you would:</p>
        <ol>
          <li>Re-authenticate using the CLI: <code>npm run cli login</code></li>
          <li>Or obtain a new refresh token from Lightspeed</li>
          <li>Check your application logs for more details</li>
        </ol>

        <p><em>This is a test alert from your Lightspeed Retail SDK CLI.</em></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Test email sent successfully");
  } catch (emailError) {
    throw new Error(`Failed to send test email: ${emailError.message}`);
  }
}

async function selectStorageBackend() {
  const { storageType } = await inquirer.prompt([
    {
      type: "list",
      name: "storageType",
      message: "Select your token storage backend:",
      choices: [
        { name: "File", value: "file" },
        { name: "Encrypted File", value: "encryptedFile" },
        {
          name: "Encrypted Database (SQLite, Postgres, MongoDB)",
          value: "database",
        },
      ],
      default: process.env.LIGHTSPEED_ENCRYPTION_KEY ? "encryptedFile" : "file",
    },
  ]);

  if (storageType === "database") {
    // Prompt for DB type
    const { dbType } = await inquirer.prompt([
      {
        type: "list",
        name: "dbType",
        message: "Select your database type:",
        choices: [
          { name: "SQLite", value: "sqlite" },
          { name: "Postgres", value: "postgres" },
          { name: "MongoDB", value: "mongodb" },
        ],
      },
    ]);
    let dbConnectionString = undefined;
    let tableName = undefined;
    switch (dbType) {
      case "sqlite": {
        const { sqlitePath } = await inquirer.prompt([
          {
            type: "input",
            name: "sqlitePath",
            message: "Enter SQLite file path:",
            default: "./tokens.sqlite",
          },
        ]);
        dbConnectionString =
          typeof sqlitePath === "string" ? sqlitePath : String(sqlitePath);
        const { table } = await inquirer.prompt([
          {
            type: "input",
            name: "table",
            message: "Enter table name:",
            default: "oauth_tokens",
          },
        ]);
        tableName = typeof table === "string" ? table : String(table);
        break;
      }
      case "postgres": {
        const { pgConn } = await inquirer.prompt([
          {
            type: "input",
            name: "pgConn",
            message: "Enter Postgres connection string:",
          },
        ]);
        dbConnectionString =
          typeof pgConn === "string" ? pgConn : String(pgConn);
        const { table } = await inquirer.prompt([
          {
            type: "input",
            name: "table",
            message: "Enter table name:",
            default: "oauth_tokens",
          },
        ]);
        tableName = typeof table === "string" ? table : String(table);
        break;
      }
      case "mongodb": {
        const { mongoConn } = await inquirer.prompt([
          {
            type: "input",
            name: "mongoConn",
            message: "Enter MongoDB connection string:",
          },
        ]);
        dbConnectionString =
          typeof mongoConn === "string" ? mongoConn : String(mongoConn);
        const { collection } = await inquirer.prompt([
          {
            type: "input",
            name: "collection",
            message: "Enter collection name:",
            default: "oauth_tokens",
          },
        ]);
        tableName =
          typeof collection === "string" ? collection : String(collection);
        break;
      }
      default:
        throw new Error("Unsupported database type");
    }
    // Dynamically import DatabaseTokenStorage
    const { DatabaseTokenStorage } = await import(
      "../storage/TokenStorage.mjs"
    );
    const dbStorage = new DatabaseTokenStorage(dbConnectionString, {
      dbType,
      tableName,
    });
    await dbStorage.init();

    // Create table/collection if it doesn't exist
    console.log(`\nSetting up ${dbType} storage...`);
    try {
      switch (dbType) {
        case "sqlite": {
          await new Promise((resolve, reject) => {
            dbStorage.db.run(
              `CREATE TABLE IF NOT EXISTS ${tableName} (app_id TEXT PRIMARY KEY, tokens TEXT NOT NULL)`,
              (err) => (err ? reject(err) : resolve())
            );
          });
          console.log(`✅ SQLite table '${tableName}' ready.`);
          break;
        }
        case "postgres": {
          await dbStorage.client.query(
            `CREATE TABLE IF NOT EXISTS ${tableName} (app_id TEXT PRIMARY KEY, tokens JSONB NOT NULL)`
          );
          console.log(`✅ Postgres table '${tableName}' ready.`);
          break;
        }
        case "mongodb": {
          const db = dbStorage.mongoClient.db();
          const collection = db.collection(tableName);
          await collection.createIndex({ app_id: 1 }, { unique: true });
          console.log(`✅ MongoDB collection '${tableName}' ready.`);
          break;
        }
      }
    } catch (err) {
      console.error(`\n❌ Failed to set up ${dbType} storage:`, err.message);
      console.log(`\n💡 Try running: npm run cli setup-db`);
      throw err;
    }

    // Always encrypt tokens when storing in database for security
    const encryptionKey =
      process.env.LIGHTSPEED_ENCRYPTION_KEY ||
      (await prompt(
        "Enter your 64-char encryption key for database storage: "
      ));

    return new EncryptedTokenStorage(dbStorage, encryptionKey);
  }

  // Determine token file path
  let tokenFile = process.env.LIGHTSPEED_TOKEN_FILE;
  if (!tokenFile) {
    // Prompt for path, default to ./tokens/encrypted-tokens.json
    const { tokenPath } = await inquirer.prompt([
      {
        type: "input",
        name: "tokenPath",
        message: "Enter token file path:",
        default: "./tokens/encrypted-tokens.json",
      },
    ]);
    tokenFile = tokenPath;
  }

  const fileStorage = new FileTokenStorage(tokenFile);
  if (storageType === "encryptedFile") {
    const encryptionKey =
      process.env.LIGHTSPEED_ENCRYPTION_KEY ||
      (await prompt("Enter your 64-char encryption key: "));
    return new EncryptedTokenStorage(fileStorage, encryptionKey);
  }
  return fileStorage;
}

program
  .command("refresh-token")
  .description(
    "Manually refresh the stored access token using the refresh token"
  )
  .action(async () => {
    let storageBackend = null;
    try {
      console.log("🔄 Refreshing stored access token...\n");

      // Get storage backend
      storageBackend = await selectStorageBackend();

      // Get existing tokens
      const tokens = await storageBackend.getTokens();
      if (!tokens || !tokens.refresh_token) {
        console.error(
          "❌ No refresh token found in storage. Please login first."
        );
        console.log("\n💡 Run: npm run cli:login");
        process.exit(1);
      }

      console.log("📋 Current token status:");
      if (tokens.expires_at) {
        const expires = new Date(tokens.expires_at);
        const now = new Date();
        const mins = Math.round((expires - now) / 60000);
        console.log(`   Expires: ${tokens.expires_at} (in ${mins} min)`);
      }
      console.log(
        `   Refresh Token: ${tokens.refresh_token.substring(0, 20)}...`
      );

      // Get required credentials
      const clientID = process.env.LIGHTSPEED_CLIENT_ID;
      const clientSecret = process.env.LIGHTSPEED_CLIENT_SECRET;

      if (!clientID || !clientSecret) {
        console.error(
          "❌ Missing client credentials in environment variables:"
        );
        console.log(
          "   Required: LIGHTSPEED_CLIENT_ID, LIGHTSPEED_CLIENT_SECRET"
        );
        console.log("\n💡 Add these to your .env file or environment");
        process.exit(1);
      }

      console.log("\n🔄 Attempting token refresh...");

      try {
        // Use the SDK to refresh the token
        const sdk = new LightspeedRetailSDK({
          accountID: process.env.LIGHTSPEED_ACCOUNT_ID || "unknown",
          clientID,
          clientSecret,
          refreshToken: tokens.refresh_token,
          tokenStorage: storageBackend,
        });

        // Force a token refresh by making an API call
        // The SDK will automatically refresh if needed
        await sdk.getAccount();

        // Get the updated tokens
        const updatedTokens = await storageBackend.getTokens();

        console.log("\n✅ Token refresh successful!");
        console.log("📋 Updated token status:");
        console.log(
          `   New Access Token: ${updatedTokens.access_token.substring(0, 20)}...`
        );
        if (updatedTokens.expires_at) {
          const expires = new Date(updatedTokens.expires_at);
          const now = new Date();
          const mins = Math.round((expires - now) / 60000);
          console.log(
            `   Expires: ${updatedTokens.expires_at} (in ${mins} min)`
          );
        }

        // Check if refresh token changed (token rotation)
        if (updatedTokens.refresh_token !== tokens.refresh_token) {
          console.log("🔄 Refresh token was rotated (updated for security)");
          console.log(
            `   New Refresh Token: ${updatedTokens.refresh_token.substring(0, 20)}...`
          );
        } else {
          console.log("🔒 Refresh token unchanged");
        }
      } catch (error) {
        console.error("\n❌ Token refresh failed:", error.message);

        if (error.message.includes("400") || error.message.includes("401")) {
          console.log("\n💡 Possible causes:");
          console.log("   - Refresh token has expired");
          console.log("   - Refresh token has been revoked");
          console.log("   - Invalid client credentials");
          console.log("\n🔧 Solutions:");
          console.log("   - Re-authenticate: npm run cli:login");
          console.log("   - Check your client ID and secret");
          console.log("   - Contact Lightspeed if the issue persists");
        } else if (
          error.message.includes("network") ||
          error.message.includes("ENOTFOUND")
        ) {
          console.log("\n💡 Network issue - check your internet connection");
        }

        process.exit(1);
      }
    } catch (error) {
      console.error("\n❌ Command failed:", error.message);
      process.exit(1);
    } finally {
      await cleanupStorageBackend(storageBackend);
    }
  });

program.parse(process.argv);
