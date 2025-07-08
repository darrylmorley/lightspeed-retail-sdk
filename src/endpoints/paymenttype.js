class PaymentTypeEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
  }

  // Get Payment Types
  async getPaymentTypes(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/PaymentType.json`,
      method: "GET",
      params: params || {},
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET PAYMENT TYPES ERROR", error, false);
      return [];
    }
  }
}

export default PaymentTypeEndpoint;
