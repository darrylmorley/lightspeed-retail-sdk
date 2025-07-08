import axios from "axios";

const operationUnits = { GET: 1, POST: 10, PUT: 10 };
const getRequestUnits = (operation) => operationUnits[operation] || 10;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Centralized query param builder for all API endpoints.
 * Accepts params as object, string, or array. Handles relations/load_relations, custom params, and avoids double-encoding.
 * @param {object|string|array} params
 * @returns {string} query string (no leading '?')
 */
export function buildQueryParams(params) {
  if (!params) {
    return "";
  }
  if (typeof params === "string") {
    const str = params.replace(/^\?/, "");
    if (str.startsWith("[")) {
      // If string starts with [, treat as load_relations
      return `load_relations=${str}`;
    }
    // If it looks like a query string (contains =), return as-is
    if (str.includes("=")) {
      return str;
    }
    // Otherwise, return as-is (legacy fallback)
    return str;
  }
  if (Array.isArray(params)) {
    // Always treat as load_relations JSON array, NOT encoded
    const relString = JSON.stringify(params);
    return "load_relations=" + relString;
  }
  const qp = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (key === "relations" || key === "load_relations") {
      if (Array.isArray(value)) {
        const relString = JSON.stringify(value);
        qp.push("load_relations=" + relString);
      } else {
        qp.push("load_relations=" + value);
      }
    } else if (key === "or") {
      // Pass or param as-is, NOT encoded
      qp.push(`or=${value}`);
    } else if (key === "timeStamp") {
      // Encode as timeStamp=>,{timestamp}, NOT encoded
      qp.push(`timeStamp=>,${value}`);
    } else {
      // Special handling for operator-comma pattern (e.g., <,5)
      if (typeof value === "string" && /^[<>]=?,/.test(value)) {
        const idx = value.indexOf(",");
        const op = value.slice(0, idx + 1); // operator and comma
        const rest = value.slice(idx + 1);
        qp.push(`${key}=${encodeURIComponent(op)}${rest}`);
      } else {
        qp.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
  }
  const result = qp.join("&");
  return result;
}

// Email notification helper
async function sendTokenRefreshFailureEmail(error, accountID) {
  try {
    // Only send email if nodemailer config is available
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.ALERT_EMAIL
    ) {
      console.warn("Email notification skipped - SMTP configuration not found");
      return;
    }

    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ALERT_EMAIL,
      subject: `🚨 Lightspeed SDK Token Refresh Failed - Account ${accountID}`,
      html: `
        <h2>🚨 Lightspeed SDK Alert</h2>
        <p><strong>Token refresh has failed for your Lightspeed Retail SDK.</strong></p>
        
        <h3>Details:</h3>
        <ul>
          <li><strong>Account ID:</strong> ${accountID}</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
          <li><strong>Error:</strong> ${error.message}</li>
        </ul>

        <h3>Action Required:</h3>
        <p>Your application may lose access to the Lightspeed API. Please:</p>
        <ol>
          <li>Re-authenticate using the CLI: <code>npm run cli login</code></li>
          <li>Or obtain a new refresh token from Lightspeed</li>
          <li>Check your application logs for more details</li>
        </ol>

        <p><em>This is an automated alert from your Lightspeed Retail SDK.</em></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Token refresh failure email sent successfully");
  } catch (emailError) {
    console.warn(
      "Failed to send token refresh failure email:",
      emailError.message
    );
  }
}

export class LightspeedSDKCore {
  static BASE_URL = "https://api.lightspeedapp.com/API/V3/Account";
  static TOKEN_URL = "https://cloud.lightspeedapp.com/auth/oauth/token";

  constructor(opts, InMemoryTokenStorage) {
    const { clientID, clientSecret, refreshToken, accountID, tokenStorage } =
      opts;

    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.accountID = accountID;
    this.baseUrl = LightspeedSDKCore.BASE_URL;
    this.tokenUrl = LightspeedSDKCore.TOKEN_URL;
    this.maxRetries = 3;
    this.lastResponse = null;
    this.token = null;
    this.tokenExpiry = null;

    // Token storage interface - defaults to in-memory if not provided
    this.tokenStorage = tokenStorage || new InMemoryTokenStorage();
  }

  // Core error handling
  handleError(context, err, shouldThrow = true) {
    const errorMessage = err?.message || "Unknown error occurred";
    const detailedMessage = `Error in ${context}: ${errorMessage}`;

    // For common scenarios like "No refresh token available" or empty responses,
    // don't log anything if shouldThrow is false
    if (!shouldThrow) {
      return; // Silent handling for warnings/empty responses
    }

    // Only log errors that are actually unexpected
    if (
      shouldThrow &&
      !errorMessage.includes("No refresh token available") &&
      !errorMessage.includes("No data available") &&
      !errorMessage.includes("Empty response")
    ) {
      console.error(detailedMessage);
    }

    if (shouldThrow) {
      throw new Error(detailedMessage);
    }
  }

  // Check if error is retryable
  isRetryableError = (err) => {
    if (!err.response) {
      return true; // Network error or timeout
    }
    return err.response.status >= 500 && err.response.status <= 599;
  };

  // Rate limiting
  handleRateLimit = async (options) => {
    if (!this.lastResponse) return null;

    const { method } = options;
    const requestUnits = getRequestUnits(method);
    const rateHeader = this.lastResponse.headers["x-ls-api-bucket-level"];

    if (!rateHeader) return null;

    const [used, available] = rateHeader.split("/");
    const availableUnits = available - used;
    if (requestUnits <= availableUnits) return 0;

    const dripRate = parseInt(
      this.lastResponse.headers["x-ls-api-drip-rate"],
      10
    );

    if (isNaN(dripRate) || dripRate <= 0) {
      this.handleError("Invalid drip rate received from API");
    }

    const unitWait = requestUnits - availableUnits;
    const delay = Math.ceil((unitWait / dripRate) * 1000);
    await sleep(delay);

    return unitWait;
  };

  // Token management
  async getToken() {
    const now = new Date();
    const bufferTime = 1 * 60 * 1000; // 1 minute buffer

    const storedTokens = await this.tokenStorage.getTokens();

    if (storedTokens.access_token && storedTokens.expires_at) {
      const expiryTime = new Date(storedTokens.expires_at);
      if (expiryTime.getTime() - now.getTime() > bufferTime) {
        this.token = storedTokens.access_token;
        return this.token;
      }
    }

    const refreshToken = storedTokens.refresh_token || this.refreshToken;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const body = {
      grant_type: "refresh_token",
      client_id: this.clientID,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    };

    try {
      const response = await axios({
        url: this.tokenUrl,
        method: "post",
        headers: { "Content-Type": "application/json" },
        data: body,
      });

      const tokenData = response.data;
      const expiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);

      await this.tokenStorage.setTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        expires_in: tokenData.expires_in,
      });

      this.token = tokenData.access_token;
      this.tokenExpiry = expiresAt;

      return this.token;
    } catch (error) {
      const helpMsg =
        "\n❌ Token refresh failed. Your refresh token may be expired or revoked.\n" +
        "👉 Please re-authenticate using the SDK's CLI or obtain a new refresh token.\n" +
        "Original error: " +
        (error?.message || error);
      console.error(helpMsg);
      process.emitWarning(helpMsg, { code: "TOKEN_REFRESH_FAILED" });

      // Send email notification about token refresh failure
      await sendTokenRefreshFailureEmail(error, this.accountID);

      throw new Error(helpMsg);
    }
  }

  // Core API request handler
  async executeApiRequest(options, retries = 0) {
    await this.handleRateLimit(options);

    const token = await this.getToken();
    if (!token) throw new Error("Error Fetching Token");

    options.headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Centralized query param handling
    if (options.params) {
      const queryString = buildQueryParams(options.params);
      if (queryString) {
        // Remove any trailing ? or & from url
        options.url = options.url.replace(/[?&]+$/, "");
        options.url += (options.url.includes("?") ? "&" : "?") + queryString;
      }
      delete options.params; // Don't let axios try to re-encode
    }

    console.log("[LightspeedSDK] Final request URL:", options.url);

    try {
      const res = await axios(options);
      this.lastResponse = res;

      if (options.method === "GET") {
        // Handle successful response with no data or empty data
        if (!res.data || Object.keys(res.data).length === 0) {
          return {
            data: {},
            next: null,
            previous: null,
          };
        }

        // Check if response has the expected structure but with empty arrays
        const dataKeys = Object.keys(res.data).filter(
          (key) => key !== "@attributes"
        );
        if (dataKeys.length > 0) {
          const firstDataKey = dataKeys[0];
          const firstDataValue = res.data[firstDataKey];

          // No need to log for empty arrays - this is normal
        }

        // Handle successful response with data
        return {
          data: res.data,
          next: res.data["@attributes"]?.next,
          previous: res.data["@attributes"]?.prev,
        };
      } else {
        return res.data;
      }
    } catch (err) {
      // Handle 401 auth errors with automatic retry
      if (err.response?.status === 401 && !options._authRetryAttempted) {
        console.log("🔄 401 error - forcing token refresh and retrying...");

        options._authRetryAttempted = true;
        this.token = null;

        try {
          await this.refreshTokens();
          return this.executeApiRequest(options, retries);
        } catch (refreshError) {
          console.error("Failed to refresh tokens:", refreshError.message);
          throw refreshError;
        }
      }

      // Handle retryable errors
      if (this.isRetryableError(err) && retries < this.maxRetries) {
        this.handleError(
          `Network Error Retrying in 2 seconds...`,
          err.message,
          false
        );
        await sleep(2000);
        return this.executeApiRequest(options, retries + 1);
      } else {
        // Simple error handling - let the calling method decide how to handle it
        throw err;
      }
    }
  }

  // Paginated data fetching
  async getAllData(options) {
    let allData = [];
    const limit = options.params?.limit;
    let firstRequest = true;
    try {
      while (options.url) {
        // Clone options for each request
        const requestOptions = { ...options };
        if (!firstRequest) {
          // Remove params for subsequent requests (pagination URLs already have them)
          delete requestOptions.params;
        }

        const { data } = await this.executeApiRequest(requestOptions);

        // Handle successful empty responses
        if (!data || Object.keys(data).length === 0) {
          break;
        }

        // Check if we have @attributes
        const attributes = data["@attributes"];
        const next = attributes?.next;
        const dataKeys = Object.keys(data).filter(
          (key) => key !== "@attributes"
        );

        if (dataKeys.length === 0) {
          break;
        }

        const selectDataArray = dataKeys[0];
        const selectedData = data[selectDataArray];

        // Handle case where selectedData is undefined, null, or empty array
        if (!selectedData) {
          break;
        }

        if (Array.isArray(selectedData)) {
          if (selectedData.length === 0) {
            break;
          }
          // If limit is set, only add up to the remaining needed
          if (limit !== undefined) {
            const remaining = limit - allData.length;
            if (remaining <= 0) {
              break;
            }
            allData = allData.concat(selectedData.slice(0, remaining));
            if (allData.length >= limit) {
              break;
            }
          } else {
            allData = allData.concat(selectedData);
          }
        } else {
          // Single item, wrap in array
          allData.push(selectedData);
        }

        // If limit is set and reached, break
        if (limit !== undefined && allData.length >= limit) {
          break;
        }

        firstRequest = false;
        options.url = next;
      }
    } catch (error) {
      return [];
    }
    // If limit is set, return only up to limit
    if (limit !== undefined) {
      return allData.slice(0, limit);
    }
    return allData;
  }

  // Utility methods
  async ping() {
    try {
      const response = await this.getAccount();
      return {
        status: "success",
        message: "API connection successful",
        data: response,
      };
    } catch (error) {
      return {
        status: "error",
        message: "API connection failed",
        error: error.message,
      };
    }
  }

  async refreshTokens() {
    try {
      this.token = null;
      this.tokenExpiry = null;
      const newToken = await this.getToken();
      return { success: true, message: "Tokens refreshed successfully" };
    } catch (error) {
      const helpMsg =
        "\n❌ Token refresh failed. Your refresh token may be expired or revoked.\n" +
        "👉 Please re-authenticate using the SDK's CLI or obtain a new refresh token.\n" +
        "Original error: " +
        (error?.message || error);
      console.error(helpMsg);
      process.emitWarning(helpMsg, { code: "TOKEN_REFRESH_FAILED" });

      // Send email notification about token refresh failure
      await sendTokenRefreshFailureEmail(error, this.accountID);

      return {
        success: false,
        message: helpMsg,
        error: error.message,
      };
    }
  }

  async getTokenInfo() {
    const storedTokens = await this.tokenStorage.getTokens();
    return {
      hasAccessToken: !!storedTokens.access_token,
      hasRefreshToken: !!storedTokens.refresh_token,
      expiresAt: storedTokens.expires_at,
      isExpired: storedTokens.expires_at
        ? new Date(storedTokens.expires_at) < new Date()
        : null,
    };
  }
}
