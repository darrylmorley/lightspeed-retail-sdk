class CategoryEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  async getCategory(id, params = {}) {
    if (!id) return this.handleError("You need to provide a categoryID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category/${id}.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CATEGORY ERROR", error, false);
      return [];
    }
  }

  async getCategories(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CATEGORIES ERROR", error, false);
      return [];
    }
  }

  async putCategory(id, data) {
    if (!id) return this.handleError("You need to provide a categoryID");
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category/${id}.json`,
      method: "PUT",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT CATEGORY ERROR", error);
    }
  }

  async postCategory(data) {
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "POST",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST CATEGORY ERROR", error);
    }
  }
}

export default CategoryEndpoint;
