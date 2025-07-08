class SaleEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Get sale by ID
  async getSale(id, params = {}) {
    if (!id) return this.handleError("You need to provide a saleID");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale/${id}.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      this.handleError("GET SALE ERROR", error, false);
      return [];
    }
  }

  // Get all sales
  async getSales(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET SALES ERROR", error, false);
      return [];
    }
  }

  // Get multiple sales by IDs
  async getMultipleSales(saleIDs, params = {}) {
    if (!saleIDs) return this.handleError("You need to provide saleIDs");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET MULTIPLE SALES ERROR", error, false);
      return [];
    }
  }

  // Update sale by ID
  async putSale(id, data) {
    if (!id) return this.handleError("You need to provide a saleID");
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale/${id}.json`,
      method: "PUT",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT SALE ERROR", error);
    }
  }

  // Create a new sale
  async postSale(data) {
    if (!data) return this.handleError("You need to provide data");
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "POST",
      data,
    };
    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST SALE ERROR", error);
    }
  }

  // Get sales by date range
  async getSalesByDateRange(params = {}) {
    if (!params.startDate || !params.endDate) {
      return this.handleError("You need to provide both start and end dates");
    }

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
      params: {
        timeStamp: `><,${params.startDate},${params.endDate}`,
        sort: params.sort || "timeStamp",
        ...params,
      },
    };

    try {
      const isLimitedRequest = typeof params === "object" && params?.limit;
      if (isLimitedRequest) {
        const response = await this.executeApiRequest(options);
        if (response?.data) {
          const data = response.data;
          if (typeof data === "object" && data !== null) {
            const dataKey = Object.keys(data).find(
              (key) => key !== "@attributes"
            );
            return dataKey && Array.isArray(data[dataKey]) ? data[dataKey] : [];
          }
        }
        return [];
      } else {
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      this.handleError("GET SALES BY DATE RANGE ERROR", error, false);
      return [];
    }
  }
}

export default SaleEndpoint;
