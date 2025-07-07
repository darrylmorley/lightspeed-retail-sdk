import { LightspeedSDKCore } from "./src/core/LightspeedSDK.mjs";
import {
  InMemoryTokenStorage,
  FileTokenStorage,
  EncryptedTokenStorage,
  DatabaseTokenStorage,
} from "./src/storage/TokenStorage.mjs";

class LightspeedRetailSDK extends LightspeedSDKCore {
  constructor(opts) {
    super(opts, InMemoryTokenStorage);
  }

  /**
   * Fetches account info for the current accountID.
   * @returns {Promise<Object>} Account info object from Lightspeed API
   */
  async getAccount() {
    console.log("Account ID", this.accountID);
    const options = {
      url: `${this.baseUrl}/${this.accountID}.json`,
      method: "GET",
      params: undefined,
    };
    try {
      const response = await this.executeApiRequest(options);
      if (response?.data?.Account) return response.data;
      if (response?.Account) return response;
      return response;
    } catch (error) {
      this.handleError("GET ACCOUNT ERROR", error, false);
      return [];
    }
  }

  // Get customer by ID
  async getCustomer(id, relations) {
    if (!id) return this.handleError("You need to provide a customerID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CUSTOMER ERROR", error, false);
      return [];
    }
  }

  // Get all customers
  async getCustomers(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "GET",
    };

    // Centralized param handling: pass params (object or string) to options, let SDK core handle query string
    if (params !== undefined && params !== null) {
      options.params = params;
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      return [];
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
    if (!id) return this.handleError("You need to provide a itemID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ITEM ERROR", error, false);
      return [];
    }
  }

  // Get multiple items by ID
  async getMultipleItems(items, relations) {
    if (!items) return this.handleError("You need to provide itemID's");

    const params = { itemID: `IN,${items}` };
    if (relations) params.load_relations = relations;

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ITEMS ERROR", error, false);
      return [];
    }
  }

  // Get all items
  async getItems(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
    };

    // Centralized param handling: pass params (object or string) to options, let SDK core handle query string
    if (params !== undefined && params !== null) {
      options.params = params;
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);

        // Handle different response structures
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }

        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET ITEMS ERROR", error, false);
      return [];
    }
  }

  // Create a new item
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
  async getVendorItems(vendorID, relations) {
    if (!vendorID) return this.handleError("You need to provide a vendorID");

    const params = { defaultVendorID: vendorID };
    if (relations) params.load_relations = relations;

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ITEMS ERROR", error, false);
      return [];
    }
  }

  // Get Matrix Item by ID
  async getMatrixItem(id, relations) {
    if (!id) return this.handleError("You need to provide a itemID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET MATRIX ITEM ERROR", error, false);
      return [];
    }
  }

  // Get all Matrix Items
  async getMatrixItems(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix.json`,
      method: "GET",
    };

    // Centralized param handling: pass params (object or string) to options, let SDK core handle query string
    if (params !== undefined && params !== null) {
      options.params = params;
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET MATRIX ITEMS ERROR", error, false);
      return [];
    }
  }

  // Update Matrix Item by ID
  async putMatrixItem(id, data) {
    if (!id) return this.handleError("You need to provide a itemID");
    if (!data) return this.handleError("You need to provide data");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix/${id}.json`,
      method: "PUT",
      data,
    };

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT ITEM ERROR", error);
    }
  }

  // Create a new Matrix Item
  async postMatrixItem(data) {
    if (!data) return this.handleError("You need to provide data");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix.json`,
      method: "POST",
      data,
    };

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST ITEM ERROR", error);
    }
  }

  // Get category by ID
  async getCategory(id, relations) {
    if (!id) return this.handleError("You need to provide a categoryID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CATEGORY ERROR", error, false);
      return [];
    }
  }

  // Get all categories
  async getCategories(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "GET",
    };

    // Centralized param handling: pass params (object or string) to options, let SDK core handle query string
    if (params !== undefined && params !== null) {
      options.params = params;
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET CATEGORIES ERROR", error, false);
      return [];
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

  // Create a new category
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
    if (!id) return this.handleError("You need to provide a manufacturerID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET MANUFACTURER ERROR", error, false);
      return [];
    }
  }

  // Get all manufacturers
  async getManufacturers(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer.json`,
      method: "GET",
    };

    // Centralized param handling: pass params (object or string) to options, let SDK core handle query string
    if (params !== undefined && params !== null) {
      options.params = params;
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET MANUFACTURERS ERROR", error, false);
      return [];
    }
  }

  // Update Manufacturer by ID
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

  // Create a new Manufacturer
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
    if (!id) return this.handleError("You need to provide a orderID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ORDER ERROR", error, false);
      return [];
    }
  }

  // Get all orders
  async getOrders(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json`,
      method: "GET",
    };

    // Centralized param handling: pass params (object or string) to options, let SDK core handle query string
    if (params !== undefined && params !== null) {
      options.params = params;
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET ORDERS ERROR", error, false);
      return [];
    }
  }

  // Get all orders by vendor
  async getOrdersByVendorID(id, relations) {
    if (!id) return this.handleError("You need to provide a vendorID");

    const params = { vendorID: id, load_relations: relations || ["Vendor"] };
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ORDERS BY VENDOR ERROR", error, false);
      return [];
    }
  }

  // Get all open orders by vendor
  async getOpenOrdersByVendorID(id, relations) {
    if (!id) return this.handleError("You need to provide a vendorID");

    const params = {
      vendorID: id,
      complete: false,
      load_relations: relations || ["Vendor", "OrderLines"],
    };
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET OPEN ORDERS BY VENDOR ERROR", error, false);
      return [];
    }
  }

  // Get vendor by ID
  async getVendor(id, relations) {
    if (!id) return this.handleError("You need to provide a vendorID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET VENDOR ERROR", error, false);
      return [];
    }
  }

  // Get all vendors
  async getVendors(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor.json`,
      method: "GET",
    };

    // Centralized param handling: pass params (object or string) to options, let SDK core handle query string
    if (params !== undefined && params !== null) {
      options.params = params;
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET VENDORS ERROR", error, false);
      return [];
    }
  }

  // Update vendor by ID
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
    if (!id) return this.handleError("You need to provide a saleID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      this.handleError("GET SALE ERROR", error, false);
      return [];
    }
  }

  // Get all sales
  async getSales(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
    };

    // Centralized param handling: pass params (object or string) to options, let SDK core handle query string
    if (params !== undefined && params !== null) {
      options.params = params;
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET SALES ERROR", error, false);
      return [];
    }
  }

  async getMultipleSales(saleIDs, relations) {
    if (!saleIDs) return this.handleError("You need to provide saleIDs");

    const params = { saleID: `IN,${saleIDs}` };
    if (relations) params.load_relations = relations;

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET MULTIPLE SALES ERROR", error, false);
      return [];
    }
  }

  // Update sale by ID
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

  // Create a new sale
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

  // Get sale lines by itemID
  async getSaleLinesByItem(itemID, relations) {
    if (!itemID) return this.handleError("You need to provide an itemID");

    const params = { itemID };
    if (relations) params.load_relations = relations;

    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      this.handleError("GET SALE ERROR", error, false);
      return [];
    }
  }

  // Get sales lines by item ID's and date range
  async getSaleLinesByItems(
    ids,
    startDate = undefined,
    endDate = undefined,
    relations
  ) {
    if (!ids) return this.handleError("You need to provide itemIDs");
    if (startDate && !endDate)
      return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    const params = { itemID: `IN,[${ids}]` };
    if (relations) params.load_relations = relations;
    if (startDate && endDate) {
      params.timeStamp = `><,${startDate},${endDate}`;
      params.sort = "timeStamp";
    }

    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      this.handleError("GET SALE ERROR", error, false);
      return [];
    }
  }

  // Get sales lines by vendor ID's and date range
  async getSaleLinesByVendorID(
    id,
    startDate = undefined,
    endDate = undefined,
    relations
  ) {
    if (!id) return this.handleError("You need to provide a vendorID");
    if (startDate && !endDate)
      return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    const params = { "Item.defaultVendorID": id };
    params.load_relations = relations || ["Item"];
    if (startDate && endDate) {
      params.timeStamp = `><,${startDate},${endDate}`;
      params.sort = "timeStamp";
    }

    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      this.handleError("GET SALE ERROR", error, false);
      return [];
    }
  }

  // Fetch all Credit Accounts
  async getGiftCards(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CreditAccount.json`,
      method: "GET",
      params: { giftCard: true },
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...options.params, ...params };
      } else if (typeof params === "string") {
        options.params = { ...options.params, load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET CREDIT ACCOUNTS ERROR", error, false);
      return [];
    }
  }

  // Fetch a Credit Account by ID
  async getGiftCard(id, relations) {
    if (!id) return this.handleError("You need to provide a gift card code");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/CreditAccount.json`,
      method: "GET",
      params: { giftCard: true, code: id },
    };

    if (relations) {
      options.params.load_relations = relations;
    }

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      this.handleError("GET CREDIT ACCOUNT ERROR", error, false);
      return [];
    }
  }

  // Get special orders
  async getSpecialOrders(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SpecialOrder.json`,
      method: "GET",
      params: { completed: 0 },
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...options.params, ...params };
      } else if (typeof params === "string") {
        options.params = { ...options.params, load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET SPECIAL ORDER ERROR", error, false);
      return [];
    }
  }

  async getImages(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Image.json`,
      method: "GET",
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...params };
      } else if (typeof params === "string") {
        options.params = { load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET IMAGES ERROR", error, false);
      return [];
    }
  }

  // Post an image
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

  // Get all employees
  async getEmployees(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee.json`,
      method: "GET",
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...params };
      } else if (typeof params === "string") {
        options.params = { load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET EMPLOYEES ERROR", error, false);
      return [];
    }
  }

  // Get employee by ID
  async getEmployee(id, relations) {
    if (!id) return this.handleError("You need to provide an employeeID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee/${id}.json`,
      method: "GET",
      params: relations ? { load_relations: relations } : undefined,
    };

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      this.handleError("GET EMPLOYEE ERROR", error, false);
      return [];
    }
  }

  // Customer Types
  async getCustomerTypes(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CustomerType.json`,
      method: "GET",
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...params };
      } else if (typeof params === "string") {
        options.params = { load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET CUSTOMER TYPES ERROR", error, false);
      return [];
    }
  }

  // Get all registers
  async getRegisters(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Register.json`,
      method: "GET",
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...params };
      } else if (typeof params === "string") {
        options.params = { load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET REGISTERS ERROR", error, false);
      return [];
    }
  }

  // Get Payment Types
  async getPaymentTypes(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/PaymentType.json`,
      method: "GET",
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...params };
      } else if (typeof params === "string") {
        options.params = { load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET PAYMENT TYPES ERROR", error, false);
      return [];
    }
  }

  // Get Tax Classes
  async getTaxClasses(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/TaxClass.json`,
      method: "GET",
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...params };
      } else if (typeof params === "string") {
        options.params = { load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET TAX CLASSES ERROR", error, false);
      return [];
    }
  }

  // Get Item Attributes
  async getItemAttributes(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemAttribute.json`,
      method: "GET",
    };

    // Centralized param handling: merge params (object or string) into options.params, let SDK core handle query string
    if (params !== undefined && params !== null) {
      if (typeof params === "object" && !Array.isArray(params)) {
        options.params = { ...params };
      } else if (typeof params === "string") {
        options.params = { load_relations: params };
      }
    }

    try {
      const isLimitedRequest =
        (typeof params === "string" && arguments[1]) ||
        (typeof params === "object" && params?.limit);

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET ITEM ATTRIBUTES ERROR", error, false);
      return [];
    }
  }

  // Search items
  async searchItems(searchTerm, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
      params: { description: `~,${searchTerm}` },
    };
    if (relations) options.params.load_relations = relations;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("SEARCH ITEMS ERROR", error);
    }
  }

  // Search customers
  async searchCustomers(searchTerm, relations) {
    const orParam = [
      `firstName=~,${searchTerm}`,
      `lastName=~,${searchTerm}`,
      `email=~,${searchTerm}`,
    ].join("||");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "GET",
      params: { or: orParam },
    };
    if (relations) options.params.load_relations = relations;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("SEARCH CUSTOMERS ERROR", error);
    }
  }

  // Get sales by date range
  async getSalesByDateRange(params = {}) {
    let startDate, endDate, relations;

    // Handle legacy parameters (startDate, endDate, relations) for backward compatibility
    if (typeof params === "string") {
      // Legacy: first parameter is startDate
      startDate = params;
      endDate = arguments[1];
      relations = arguments[2];
    } else if (typeof params === "object" && params !== null) {
      // New object-based parameters
      ({ startDate, endDate, relations } = params);
    }

    if (!startDate || !endDate) {
      return this.handleError("You need to provide both start and end dates");
    }

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
      params: {
        timeStamp: `><,${startDate},${endDate}`,
        sort:
          typeof params === "object" && params?.sort
            ? params.sort
            : "timeStamp",
      },
    };
    if (relations) options.params.load_relations = relations;
    if (typeof params === "object" && params?.limit)
      options.params.limit = Math.min(params.limit, 100);

    try {
      const isLimitedRequest = typeof params === "object" && params?.limit;

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET SALES BY DATE RANGE ERROR", error, false);
      return [];
    }
  }

  // Get items by category
  async getItemsByCategory(params = {}) {
    let categoryId, relations;

    // Handle legacy parameters (categoryId, relations) for backward compatibility
    if (typeof params === "string" || typeof params === "number") {
      // Legacy: first parameter is categoryId
      categoryId = params;
      relations = arguments[1];
    } else if (typeof params === "object" && params !== null) {
      // New object-based parameters
      ({ categoryId, relations } = params);
    }

    if (!categoryId) {
      return this.handleError("You need to provide a categoryID");
    }

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
      params: { categoryID: categoryId },
    };
    if (relations) options.params.load_relations = relations;
    if (typeof params === "object" && params?.limit)
      options.params.limit = Math.min(params.limit, 100);
    if (typeof params === "object" && params?.timeStamp)
      options.params.timeStamp = `>${params.timeStamp}`;
    if (typeof params === "object" && params?.sort)
      options.params.sort = params.sort;

    try {
      const isLimitedRequest = typeof params === "object" && params?.limit;

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET ITEMS BY CATEGORY ERROR", error, false);
      return [];
    }
  }

  // Get low stock items
  async getItemsWithLowStock(params = {}) {
    let threshold = 5,
      relations;

    // Handle legacy parameters (threshold, relations) for backward compatibility
    if (typeof params === "number") {
      // Legacy: first parameter is threshold
      threshold = params;
      relations = arguments[1];
    } else if (typeof params === "object" && params !== null) {
      // New object-based parameters
      ({ threshold = 5, relations } = params);
    }

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
      params: { qoh: `<,${threshold}` },
    };
    if (relations) options.params.load_relations = relations;
    if (typeof params === "object" && params?.limit)
      options.params.limit = Math.min(params.limit, 100);
    if (typeof params === "object" && params?.timeStamp)
      options.params.timeStamp = `>${params.timeStamp}`;
    if (typeof params === "object" && params?.sort)
      options.params.sort = params.sort;

    try {
      const isLimitedRequest = typeof params === "object" && params?.limit;

      if (isLimitedRequest) {
        // Single page request
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET LOW STOCK ITEMS ERROR", error, false);
      return [];
    }
  }

  // Bulk operations
  async updateMultipleItems(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      return this.handleError("You need to provide an array of item updates");
    }

    const results = [];
    for (const update of updates) {
      if (!update.itemID || !update.data) {
        results.push({ error: "Missing itemID or data", update });
        continue;
      }

      try {
        const result = await this.putItem(update.itemID, update.data);
        results.push({ success: true, itemID: update.itemID, result });
      } catch (error) {
        results.push({ error: error.message, itemID: update.itemID });
      }
    }

    return results;
  }

  // Helper method for content type detection (for image uploads)
  #getContentType(filename) {
    const ext = filename.toLowerCase().split(".").pop();
    const contentTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return contentTypes[ext] || "application/octet-stream";
  }
}

export default LightspeedRetailSDK;
export {
  FileTokenStorage,
  InMemoryTokenStorage,
  EncryptedTokenStorage,
  DatabaseTokenStorage,
};
