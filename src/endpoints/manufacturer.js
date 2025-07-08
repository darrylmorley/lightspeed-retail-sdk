class ManufacturerEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Get Manufacturer by ID
  async getManufacturer(id, params = {}) {
    if (!id) return this.handleError("You need to provide a manufacturerID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer/${id}.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET MANUFACTURER ERROR", error, false);
      return [];
    }
  }

  // Get all manufacturers
  async getManufacturers(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET MANUFACTURERS ERROR", error, false);
      return [];
    }
  }

  // Update Manufacturer by ID
  async putManufacturer(id, data) {
    if (!id) return this.handleError("You need to provide a manufacturerID");
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer/${id}.json`,
      method: "PUT",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT MANUFACTURER ERROR", error);
    }
  }

  // Create a new Manufacturer
  async postManufacturer(data) {
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer.json`,
      method: "POST",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST MANUFACTURER ERROR", error);
    }
  }
}

export default ManufacturerEndpoint;
