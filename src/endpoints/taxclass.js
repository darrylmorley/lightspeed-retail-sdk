class TaxClassEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
  }

  // Get Tax Classes
  async getTaxClasses(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/TaxClass.json`,
      method: "GET",
      params: params || {},
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET TAX CLASSES ERROR", error, false);
      return [];
    }
  }
}

export default TaxClassEndpoint;
