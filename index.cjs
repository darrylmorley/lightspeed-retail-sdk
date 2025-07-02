const axios = require("axios");

const operationUnits = { GET: 1, POST: 10, PUT: 10 };
const getRequestUnits = (operation) => operationUnits[operation] || 10;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Default in-memory storage (fallback)
class InMemoryTokenStorage {
  constructor() {
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

class LightspeedRetailSDK {
  static BASE_URL = "https://api.lightspeedapp.com/API/V3/Account";
  // Update to new OAuth endpoint
  static TOKEN_URL = "https://cloud.lightspeedapp.com/auth/oauth/token";

  constructor(opts) {
    const {
      clientID,
      clientSecret,
      refreshToken,
      accountID,
      tokenStorage, // New parameter for token storage
    } = opts;

    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.accountID = accountID;
    this.baseUrl = LightspeedRetailSDK.BASE_URL;
    this.tokenUrl = LightspeedRetailSDK.TOKEN_URL;
    this.maxRetries = 3;
    this.lastResponse = null;
    this.token = null;
    this.tokenExpiry = null;

    // Token storage interface - defaults to in-memory if not provided
    this.tokenStorage = tokenStorage || new InMemoryTokenStorage();
  }

  // handleError function to handle errors
  handleError(context, err, shouldThrow = true) {
    // Context includes information about where the error occurred
    const errorMessage = err?.message || "Unknown error occurred";
    const detailedMessage = `Error in ${context}: ${errorMessage}`;

    // Log the error message
    console.error(detailedMessage);

    // Log the stack trace if available
    if (err?.stack) {
      console.error("Stack trace:", err.stack);
    }

    // If the error has response data, log it
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

      // Optionally rethrow the error with the detailed message
      if (shouldThrow) {
        throw new Error(detailedMessage);
      }
    }
  }

  // Update the last response
  setLastResponse = (response) => (this.lastResponse = response);

  // Handle rate limits
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

    // Check if dripRate is a valid number greater than 0
    if (isNaN(dripRate) || dripRate <= 0) {
      this.handleError.error("Invalid drip rate received from API");
    }

    const unitWait = requestUnits - availableUnits;
    const delay = Math.ceil((unitWait / dripRate) * 1000);
    await sleep(delay);

    return unitWait;
  };

  // Get a new token
  getToken = async () => {
    const now = new Date();
    const bufferTime = 1 * 60 * 1000; // 1 minute buffer

    // Load tokens from storage
    const storedTokens = await this.tokenStorage.getTokens();

    // Check if we have a valid cached token
    if (storedTokens.access_token && storedTokens.expires_at) {
      const expiryTime = new Date(storedTokens.expires_at);
      if (expiryTime.getTime() - now.getTime() > bufferTime) {
        this.token = storedTokens.access_token;
        return this.token;
      }
    }

    // Use stored refresh token or fallback to constructor value
    const refreshToken = storedTokens.refresh_token || this.refreshToken;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // Fetch a new token pair
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
        headers: {
          "Content-Type": "application/json",
        },
        data: body, // Send as JSON object, not stringified
      });

      const tokenData = response.data;

      // Calculate expiry time
      const expiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);

      // Store both tokens
      await this.tokenStorage.setTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        expires_in: tokenData.expires_in,
      });

      // Update instance properties
      this.token = tokenData.access_token;
      this.tokenExpiry = expiresAt;

      return this.token;
    } catch (error) {
      return this.handleError("GET TOKEN ERROR", error);
    }
  };

  // Fetch a resource
  executeApiRequest = async (options, retries = 0) => {
    await this.handleRateLimit(options);

    const token = await this.getToken();
    if (!token) throw new Error("Error Fetching Token");

    // Set common headers
    options.headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers, // Merge with any additional headers passed in options
    };

    try {
      const res = await axios(options);
      this.lastResponse = res;

      // Return the data
      if (options.method === "GET") {
        return {
          data: res.data,
          next: res.next,
          previous: res.previous,
        };
      } else {
        return res.data; // For POST and PUT, typically just return the data
      }
    } catch (err) {
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
  };

  // Get paginated data
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

  // Check if error is retryable
  isRetryableError = (err) => {
    if (!err.response) {
      // No response (network error or timeout)
      return true;
    }

    // Retry for server errors (500-599)
    return err.response.status >= 500 && err.response.status <= 599;
  };

  // Get customer by ID
  async getCustomer(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a customerID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CUSTOMERS ERROR", error);
    }
  }

  // Get all customers
  async getCustomers(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CUSTOMERS ERROR", error);
    }
  }

  async putCustomer(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a customerID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT CUSTOMER ERROR", error);
    }
  }

  async postCustomer(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST CUSTOMER ERROR", error);
    }
  }

  // Get item by ID
  async getItem(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a itemID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ERROR", error);
    }
  }

  // Get multiple items by ID
  async getMultipleItems(items, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
    };

    if (!items) this.handleError("You need to provide itemID's");

    if (items) options.url = options.url + `?itemID=IN,${items}`;

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error);
    }
  }

  // Get all items
  async getItems(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error);
    }
  }

  async putItem(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a itemID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT ITEM ERROR", error);
    }
  }

  async postItem(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST ITEM ERROR", error);
    }
  }

  // Get all items by vendor
  async getvendorItems(vendorID, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json?defaultVendorID=${vendorID}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error);
    }
  }

  // Get Matrix Item by ID
  async getMatrixItem(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a itemID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ERROR", error);
    }
  }

  // Get all Matrix Items
  async getMatrixItems(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ERROR", error);
    }
  }

  async putMatrixItem(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a itemID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT ITEM ERROR", error);
    }
  }

  async postMatrixItem(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST ITEM ERROR", error);
    }
  }

  // Get category by ID
  async getCategory(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a categoryID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORY ERROR", error);
    }
  }

  // Get all categories
  async getCategories(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error);
    }
  }

  async putCategory(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a categoryID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT CATEGORY ERROR", error);
    }
  }

  async postCategory(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST CATEGORY ERROR", error);
    }
  }

  // Get Manufacturer by ID
  async getManufacturer(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a manufacturerID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET MANUFACTURER ERROR", error);
    }
  }

  // Get all manufacturers
  async getManufacturers(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET MANUFACTURERS ERROR", error);
    }
  }

  async putManufacturer(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a manufacturerID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT MANUFACTURER ERROR", error);
    }
  }

  async postManufacturer(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST MANUFACTURER ERROR", error);
    }
  }

  // Get order by ID
  async getOrder(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a orderID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ORDER ERROR", error);
    }
  }

  // Get all orders
  async getOrders(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ORDERS ERROR", error);
    }
  }

  // Get all orders by vendor
  async getOrdersByVendorID(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json?load_relations=["Vendor"]&vendorID=${id}`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a vendorID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ORDER ERROR", error);
    }
  }

  // Get all open orders by vendor
  async getOpenOrdersByVendorID(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json?load_relations=["Vendor", "OrderLines"]&vendorID=${id}&complete=false`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a vendorID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ORDER ERROR", error);
    }
  }

  // Get vendor by ID
  async getVendor(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a vendorID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET VENDOR ERROR", error);
    }
  }

  // Get all vendors
  async getVendors(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET VENDORS ERROR", error);
    }
  }

  async putVendor(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a vendorID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT VENDOR ERROR", error);
    }
  }

  async postVendor(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST VENDOR ERROR", error);
    }
  }

  // Get sale by ID
  async getSale(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a saleID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Get all sales
  async getSales(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALES ERROR", error);
    }
  }

  async getMultipleSales(saleIDs, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json?saleID=IN,${saleIDs}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  async putSale(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a saleID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT SALE ERROR", error);
    }
  }

  async postSale(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST SALE ERROR", error);
    }
  }

  async getSaleLinesByItem(itemID, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json?itemID=${itemID}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Get sales lines by item ID's and date range
  async getSaleLinesByItems(
    ids,
    startDate = undefined,
    endDate = undefined,
    relations
  ) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json?itemID=IN,[${ids}]`,
      method: "GET",
    };

    if (!ids) return this.handleError("You need to provide itemIDs");
    if (startDate && !endDate)
      return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    if (startDate && endDate)
      options.url =
        options.url +
        `&timeStamp=%3E%3C%2C${startDate}%2C${endDate}&sort=timeStamp`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Get sales lines by vendor ID's and date range
  async getSaleLinesByVendorID(
    id,
    startDate = undefined,
    endDate = undefined,
    relations
  ) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json?load_relations=${
        relations ? relations : `["Item"]`
      }&Item.defaultVendorID=${id}`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a vendorID");
    if (startDate && !endDate)
      return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    if (startDate && endDate)
      options.url =
        options.url +
        `&timeStamp=%3E%3C%2C${startDate}%2C${endDate}&sort=timeStamp`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Fetch all Credit Accounts
  async getGiftCards(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CreditAccount.json?giftCard=true`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CREDIT ACCOUNTS ERROR", error);
    }
  }

  // Fetch a Credit Account by ID
  async getGiftCard(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CreditAccount.json?giftCard=true&code=${id}`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a gift card code");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CREDIT ACCOUNT ERROR", error);
    }
  }

  // Get special orders
  async getSpecialOrders(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SpecialOrder.json?completed=0`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SPECIAL ORDER ERROR", error);
    }
  }

  async getImages(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Image.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error);
    }
  }

  async postImage(imageFilePath, metadata) {
    if (!imageFilePath)
      return this.handleError("You need to provide an image file path");
    if (!metadata || (!metadata.itemID && !metadata.itemMatrixID)) {
      return this.handleError(
        "You need to provide metadata with either itemID or itemMatrixID"
      );
    }

    // Import required modules dynamically
    const FormData = (await import("form-data")).default;
    const fs = (await import("fs")).default;
    const path = (await import("path")).default;

    // Create form data object
    const formData = new FormData();

    // Add the metadata as JSON string to the 'data' field
    formData.append("data", JSON.stringify(metadata));

    // Get filename from path
    const filename = path.basename(imageFilePath);

    // Add the image file to the form
    formData.append("image", fs.createReadStream(imageFilePath), {
      filename,
      contentType: this.getContentType(filename),
    });

    const token = await this.getToken();
    if (!token) throw new Error("Error Fetching Token");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Image.json`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      },
      data: formData,
    };

    try {
      const response = await axios(options);
      return response.data;
    } catch (error) {
      return this.handleError("POST IMAGE ERROR", error);
    }
  }
}

module.exports = LightspeedRetailSDK;
