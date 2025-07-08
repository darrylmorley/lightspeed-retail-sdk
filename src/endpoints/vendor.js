class VendorEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Get vendor by ID
  async getVendor(id, params = {}) {
    if (!id) return this.handleError("You need to provide a vendorID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor/${id}.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET VENDOR ERROR", error, false);
      return [];
    }
  }

  // Get all vendors
  async getVendors(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET VENDORS ERROR", error, false);
      return [];
    }
  }

  // Update vendor by ID
  async putVendor(id, data) {
    if (!id) return this.handleError("You need to provide a vendorID");
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor/${id}.json`,
      method: "PUT",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT VENDOR ERROR", error);
    }
  }

  // Create a new vendor
  async postVendor(data) {
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor.json`,
      method: "POST",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST VENDOR ERROR", error);
    }
  }
}

export default VendorEndpoint;
