class OrderEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
  }

  // Get order by ID
  async getOrder(id, params = {}) {
    if (!id) return this.handleError("You need to provide a orderID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order/${id}.json`,
      method: "GET",
      params,
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
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ORDERS ERROR", error, false);
      return [];
    }
  }

  // Get all orders by vendor
  async getOrdersByVendorID(id, params = {}) {
    if (!id) return this.handleError("You need to provide a vendorID");
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
  async getOpenOrdersByVendorID(id, params = {}) {
    if (!id) return this.handleError("You need to provide a vendorID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json?vendorID=${id}&complete=false&`,
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
}

export default OrderEndpoint;
