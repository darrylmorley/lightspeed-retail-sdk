#!/usr/bin/env node
import { Command } from "commander";
import open from "open";
import dotenv from "dotenv";
import readline from "readline";
import {
  FileTokenStorage,
  EncryptedTokenStorage,
} from "../src/storage/TokenStorage.mjs";
import { LightspeedSDKCore } from "../src/core/LightspeedSDK.mjs";
import inquirer from "inquirer"; // npm install inquirer

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
  .command("status")
  .description("Show current token status")
  .action(async () => {
    // Load tokens and print status
  });

program
  .command("reset")
  .description("Clear stored tokens")
  .action(async () => {
    // Overwrite tokens with empty object
  });

program
  .command("whoami")
  .description("Show account info for current token")
  .action(async () => {
    // Use SDK to fetch and print account info
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

  const fileStorage = new FileTokenStorage("./tests/live-tokens.json");
  if (storageType === "encryptedFile") {
    const encryptionKey =
      process.env.LIGHTSPEED_ENCRYPTION_KEY ||
      (await prompt("Enter your 64-char encryption key: "));
    return new EncryptedTokenStorage(fileStorage, encryptionKey);
  }
  return fileStorage;
}

program.parse(process.argv);
