class RegisterEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
  }

  // Get all registers
  async getRegisters(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Register.json`,
      method: "GET",
      params: params || {},
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET REGISTERS ERROR", error, false);
      return [];
    }
  }
}

export default RegisterEndpoint;
