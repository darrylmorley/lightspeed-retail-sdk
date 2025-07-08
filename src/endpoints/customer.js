class CustomerEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Get customer by ID
  async getCustomer(id, params = {}) {
    if (!id) return this.handleError("You need to provide a customerID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer/${id}.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CUSTOMER ERROR", error, false);
      return [];
    }
  }

  // Get all customers
  async getCustomers(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET CUSTOMERS ERROR", error, false);
      return [];
    }
  }

  async putCustomer(id, data) {
    if (!id) return this.handleError("You need to provide a customerID");
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer/${id}.json`,
      method: "PUT",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT CUSTOMER ERROR", error);
    }
  }

  async postCustomer(data) {
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "POST",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST CUSTOMER ERROR", error);
    }
  }

  // Search customers
  async searchCustomersByEmail(email) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "GET",
      params: {
        load_relations: '["Contact"]',
        "Contact.email": `~,${email}`,
      },
    };

    console.log("searchCustomers options:", options);

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("SEARCH CUSTOMERS ERROR", error);
    }
  }
}

export default CustomerEndpoint;
