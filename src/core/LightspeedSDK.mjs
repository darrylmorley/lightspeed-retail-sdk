import axios from "axios";

const operationUnits = { GET: 1, POST: 10, PUT: 10 };
const getRequestUnits = (operation) => operationUnits[operation] || 10;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    console.error(detailedMessage);

    if (err?.stack) {
      console.error("Stack trace:", err.stack);
    }

    if (err?.response) {
      console.error("Error response:", {
        status: err.response?.status,
        headers: err.response?.headers,
        data: err.response?.data,
      });
    } else if (!err?.response && typeof err === "object") {
      console.error("Non-response error object:", err);
    } else if (typeof err === "string") {
      console.error("Error as string:", err);
    } else {
      console.error("Error of unknown type:", err);

      if (shouldThrow) {
        throw new Error(detailedMessage);
      }
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

    try {
      const res = await axios(options);
      this.lastResponse = res;

      if (options.method === "GET") {
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
        this.handleError(
          `Failed Request statusText: ${err.response?.statusText}`
        );
        this.handleError(`Failed data: ${err.response?.data}`);
        throw err;
      }
    }
  }

  // Paginated data fetching
  async getAllData(options) {
    let allData = [];
    while (options.url) {
      const { data } = await this.executeApiRequest(options);
      let next = data["@attributes"].next;
      let selectDataArray = Object.keys(data)[1];
      let selectedData = data[selectDataArray];
      allData = allData.concat(selectedData);
      options.url = next;
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
