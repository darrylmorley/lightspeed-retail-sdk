class CustomerTypeEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
  }

  async getCustomerType(id, params = {}) {
    if (!id) return this.handleError("You need to provide a customerTypeID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CustomerType/${id}.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CUSTOMER TYPE ERROR", error, false);
      return [];
    }
  }

  // Get all customer types
  async getCustomerTypes(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CustomerType.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CUSTOMER TYPES ERROR", error, false);
      return [];
    }
  }
}

export default CustomerTypeEndpoint;
