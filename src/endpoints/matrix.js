class MatrixEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Get Matrix Item by ID
  async getMatrixItem(id, params = {}) {
    if (!id) return this.handleError("You need to provide a itemID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix/${id}.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET MATRIX ITEM ERROR", error, false);
      return [];
    }
  }

  // Get all Matrix Items
  async getMatrixItems(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET MATRIX ITEMS ERROR", error, false);
      return [];
    }
  }

  // Update Matrix Item by ID
  async putMatrixItem(id, data) {
    if (!id) return this.handleError("You need to provide a itemID");
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix/${id}.json`,
      method: "PUT",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT ITEM ERROR", error);
    }
  }

  // Create a new Matrix Item
  async postMatrixItem(data) {
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix.json`,
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
}

export default MatrixEndpoint;
