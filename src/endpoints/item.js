class ItemEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Get item by ID
  async getItem(id, params = {}) {
    if (!id) return this.handleError("You need to provide a itemID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item/${id}.json`,
      method: "GET",
      params,
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
  async getMultipleItems(items, params = {}) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return this.handleError("You need to provide an array of itemIDs");
    }
    const itemIDParam = `IN,[${items.join(",")}]`;
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
      params: { ...params, itemID: itemIDParam },
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

  // Create a new item
  async postItem(data) {
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
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

  // Get all items by vendor
  async getVendorItems(vendorID, params = {}) {
    if (!vendorID) return this.handleError("You need to provide a vendorID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json?defaultVendorID=${vendorID}`,
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

  // Get items by category
  async getItemsByCategory(categoryId, params = {}) {
    if (!categoryId) {
      return this.handleError("You need to provide a categoryID");
    }
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
      params: { categoryID: categoryId, ...(params || {}) },
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ITEMS BY CATEGORY ERROR", error, false);
      return [];
    }
  }

  // Get low stock items
  async getItemsWithLowStock(params = {}) {
    const threshold = params?.threshold ?? 0;
    const { threshold: _, ...restParams } = params || {};
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
      params: { qoh: `<,${threshold}`, ...restParams },
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET LOW STOCK ITEMS ERROR", error, false);
      return [];
    }
  }
}

export default ItemEndpoint;
