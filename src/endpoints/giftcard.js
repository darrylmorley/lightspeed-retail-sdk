class GiftCardEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Fetch all Credit Accounts (Gift Cards)
  async getGiftCards(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CreditAccount.json`,
      method: "GET",
      params: { giftCard: "true", ...(params || {}) },
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CREDIT ACCOUNTS ERROR", error, false);
      return [];
    }
  }

  // Fetch a Credit Account by ID (Gift Card)
  async getGiftCard(code, params = {}) {
    if (!code) return this.handleError("You need to provide a gift card code");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/CreditAccount.json`,
      method: "GET",
      params: {
        giftCard: "true",
        archived: "true",
        code: String(code),
        ...params,
      },
    };

    try {
      const response = await this.getAllData(options);
      console.log("GiftCard API raw response:", response);
      // Always return an array
      if (Array.isArray(response)) {
        return response;
      }
      if (response) {
        return [response];
      }
      return [];
    } catch (error) {
      this.handleError("GET CREDIT ACCOUNT ERROR", error, false);
      return [];
    }
  }
}

export default GiftCardEndpoint;
