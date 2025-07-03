#!/usr/bin/env node
import { Command } from "commander";
import open from "open";
import dotenv from "dotenv";
import {
  FileTokenStorage,
  EncryptedTokenStorage,
} from "../../dist/src/storage/TokenStorage.mjs";
import LightspeedRetailSDK from "../../dist/index.mjs";
import inquirer from "inquirer";

dotenv.config();

const program = new Command();

program
  .name("lightspeed-retail-sdk")
  .description("Lightspeed Retail SDK CLI")
  .version("3.1.0");

program
  .command("login")
  .description("Authenticate and store new tokens")
  .action(async () => {
    // 1. Gather clientID, clientSecret, etc. from env or prompt
    const clientID =
      process.env.LIGHTSPEED_CLIENT_ID ||
      (await prompt("Enter your Lightspeed Client ID: "));
    const clientSecret =
      process.env.LIGHTSPEED_CLIENT_SECRET ||
      (await prompt("Enter your Lightspeed Client Secret: "));
    const redirectUri =
      process.env.LIGHTSPEED_REDIRECT_URI ||
      (await prompt(
        "Enter your Redirect URI (must match your app settings): "
      ));
    const scopes =
      process.env.LIGHTSPEED_SCOPES ||
      (await prompt(
        "Enter scopes (space-separated, e.g. employee:all inventory:all): "
      ));

    // 2. Build OAuth URL
    const authUrl = `https://cloud.lightspeedapp.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(
      clientID
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}`;

    console.log("\nOpening browser for authentication...");
    await open(authUrl);

    // 3. Prompt for code
    const code = await prompt(
      "\nPaste the code from the redirected URL (code=...): "
    );

    // 4. Exchange code for tokens
    try {
      const tokenUrl = "https://cloud.lightspeedapp.com/oauth/token";
      const response = await axios.post(
        tokenUrl,
        {
          grant_type: "authorization_code",
          code,
          client_id: clientID,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const tokenData = response.data;
      const expiresAt = new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString();

      // 5. Store tokens using storage backend
      const storageBackend = await selectStorageBackend();
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
  });

program
  .command("token-status")
  .description("Show current token status")
  .action(async () => {
    const storageBackend = await selectStorageBackend();
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
  .command("whoami")
  .description("Show account info for current token")
  .action(async () => {
    const storageBackend = await selectStorageBackend();
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

async function selectStorageBackend() {
  const { storageType } = await inquirer.prompt([
    {
      type: "list",
      name: "storageType",
      message: "Select your token storage backend:",
      choices: [
        { name: "File", value: "file" },
        { name: "Encrypted File", value: "encryptedFile" },
        { name: "Database (template)", value: "database" },
      ],
      default: process.env.LIGHTSPEED_ENCRYPTION_KEY ? "encryptedFile" : "file",
    },
  ]);

  if (storageType === "database") {
    // You'd prompt for DB connection details here
    throw new Error("DatabaseTokenStorage is not implemented in this CLI yet.");
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

program.parse(process.argv);
