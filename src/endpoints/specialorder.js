class SpecialOrderEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
  }

  // Get special orders
  async getSpecialOrders(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SpecialOrder.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET SPECIAL ORDER ERROR", error, false);
      return [];
    }
  }
}

export default SpecialOrderEndpoint;
