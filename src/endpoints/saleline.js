class SaleLineEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
  }

  // Get sale lines by itemID
  async getSaleLinesByItem(itemID, params = {}) {
    if (!itemID) return this.handleError("You need to provide an itemID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json`,
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

  // Get sales lines by vendor ID's and date range
  async getSaleLinesByVendorID(
    id,
    startDate = undefined,
    endDate = undefined,
    params = {}
  ) {
    if (!id) return this.handleError("You need to provide a vendorID");
    if (startDate && !endDate)
      return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    if (startDate && endDate) {
      params.timeStamp = `><,${startDate},${endDate}`;
      params.sort = "timeStamp";
    }

    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json`,
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
}

export default SaleLineEndpoint;
