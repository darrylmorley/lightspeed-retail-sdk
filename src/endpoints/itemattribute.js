class ItemAttributeEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
  }

  async getItemAttribute(id, params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemAttributeSet/${id}.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ITEM ATTRIBUTES ERROR", error, false);
      return [];
    }
  }

  // Get Item Attributes
  async getItemAttributes(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemAttributeSet.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET ITEM ATTRIBUTES ERROR", error, false);
      return [];
    }
  }
}

export default ItemAttributeEndpoint;
