class AccountEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Get account info for the current accountID
  async getAccount() {
    if (!this.accountID) {
      return this.handleError("No accountID set in SDK instance", null, false);
    }
    const options = {
      url: `${this.baseUrl}/${this.accountID}.json`,
      method: "GET",
      params: undefined,
    };
    try {
      const response = await this.executeApiRequest(options);
      if (response?.Account) return response.Account;
      if (response?.data?.Account) return response.data.Account;
      return response;
    } catch (error) {
      console.error("getAccount error:", error);
      this.handleError("GET ACCOUNT ERROR", error, false);
      return null;
    }
  }
}

export default AccountEndpoint;
