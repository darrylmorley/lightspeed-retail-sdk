import axios from "axios";

// Cost per operation
const getRequestUnits = (operation) => {
  switch (operation) {
    case "GET":
      return 1;
    case "POST":
      return 10;
    case "PUT":
      return 10;
    default:
      return 10;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class LightspeedRetailSDK {
  constructor(opts) {
    const { clientID, clientSecret, refreshToken, accountID } = opts;

    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.accountID = accountID;
    this.baseUrl = "https://api.lightspeedapp.com/API/V3/Account";
    this.maxRetries = 3;
    this.lastResponse = null;
  }

  handleError(msg, err) {
    console.error(`${msg} - ${err}`);
    throw err;
  }

  setLastResponse = (response) => (this.lastResponse = response);

  handleRateLimit = async (options) => {
    if (!this.lastResponse) return null;

    const { method } = options;

    const requestUnits = getRequestUnits(method);
    const rateHeader = this.lastResponse.headers["x-ls-api-bucket-level"];

    if (!rateHeader) return null;

    const [used, available] = rateHeader.split("/");
    const availableUnits = available - used;
    if (requestUnits <= availableUnits) return 0;

    const dripRate = this.lastResponse.headers["x-ls-api-drip-rate"];
    const unitWait = requestUnits - availableUnits;
    const delay = Math.ceil((unitWait / dripRate) * 1000);
    await sleep(delay);

    return unitWait;
  };

  getToken = async () => {
    const body = {
      grant_type: "refresh_token",
      client_id: this.clientID,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    };

    const response = await axios({
      url: "https://cloud.lightspeedapp.com/oauth/access_token.php",
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(body),
    }).catch((error) => console.error(error.data));

    const tokenData = await response.data;
    const token = tokenData.access_token;

    return token;
  };

  getResource = async (options, retries = 0) => {
    this.handleRateLimit(options);

    const token = await this.getToken();

    if (!token) throw new Error("Error Fetching Token");

    options.headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const res = await axios(options);
      this.lastResponse = res;
      return {
        data: res.data,
        next: res.next,
        previous: res.previous,
      };
    } catch (err) {
      if (retries < this.maxRetries) {
        console.log(`Error: ${err}, retrying in 2 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return await this.getResource(options.url, retries + 1);
      } else {
        console.error(`Failed Request statusText: `, res.statusText);
        console.log(`Failed data: `, response.data);
        throw err;
      }
    }
  };

  async getAllData(options) {
    let allData = [];
    while (options.url) {
      const { data } = await this.getResource(options);
      let next = data["@attributes"].next;
      let selectDataArray = Object.keys(data)[1];
      let selectedData = data[selectDataArray];
      allData = allData.concat(selectedData);
      options.url = next;
    }
    // console.log(allData);
    return allData;
  }

  // Get customer by ID
  async getCustomer(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a customerID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CUSTOMERS ERROR", error);
    }
  }

  // Get all customers
  async getCustomers(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CUSTOMERS ERROR", error);
    }
  }

  // Get item by ID
  async getItem(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a itemID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ERROR", error);
    }
  }

  // Get multiple items by ID
  async getMultipleItems(items, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
    };

    if (!items) this.handleError("You need to provide itemID's");

    if (items) options.url = options.url + `?itemID=IN,${items}`;

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error);
    }
  }

  // Get all items
  async getItems(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error);
    }
  }

  // Get all items by vendor
  async getvendorItems(vendorID, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json?defaultVendorID=${vendorID}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error);
    }
  }

  // Get all Matrix Items
  async getMatrixItems(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ERROR", error);
    }
  }

  // Get Matrix Item by ID
  async getMatrixItem(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a itemID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ERROR", error);
    }
  }

  // Get category by ID
  async getCategory(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a categoryID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORY ERROR", error);
    }
  }

  // Get all categories
  async getCategories(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error);
    }
  }

  // Get Manufacturer by ID
  async getManufacturer(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a manufacturerID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET MANUFACTURER ERROR", error);
    }
  }

  // Get all manufacturers
  async getManufacturers(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET MANUFACTURERS ERROR", error);
    }
  }

  // Get order by ID
  async getOrder(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a orderID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ORDER ERROR", error);
    }
  }

  // Get all orders
  async getOrders(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ORDERS ERROR", error);
    }
  }

  // Get all orders by vendor
  async getOrdersByVendorID(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json?load_relations=["Vendor"]&vendorID=${id}`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a vendorID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ORDER ERROR", error);
    }
  }

  // Get all open orders by vendor
  async getOpenOrdersByVendorID(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json?load_relations=["Vendor", "OrderLines"]&vendorID=${id}&complete=false`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a vendorID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ORDER ERROR", error);
    }
  }

  // Get vendor by ID
  async getVendor(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a vendorID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET VENDOR ERROR", error);
    }
  }

  // Get all vendors
  async getVendors(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET VENDORS ERROR", error);
    }
  }

  // Get sale by ID
  async getSale(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a saleID");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Get all sales
  async getSales(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALES ERROR", error);
    }
  }

  async getSaleLinesByItem(itemID, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json?itemID=${itemID}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Get sales lines by item ID's and date range
  async getSaleLinesByItems(ids, startDate = undefined, endDate = undefined, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json?itemID=IN,[${ids}]`,
      method: "GET",
    };

    if (!ids) return this.handleError("You need to provide itemIDs");
    if (startDate && !endDate) return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    if (startDate && endDate)
      options.url =
        options.url + `&timeStamp=%3E%3C%2C${startDate}%2C${endDate}&sort=timeStamp`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Get sales lines by vendor ID's and date range
  async getSaleLinesByVendorID(
    id,
    startDate = undefined,
    endDate = undefined,
    relations
  ) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json?load_relations=${
        relations ? relations : `["Item"]`
      }&Item.defaultVendorID=${id}`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a vendorID");
    if (startDate && !endDate) return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    if (startDate && endDate)
      options.url =
        options.url + `&timeStamp=%3E%3C%2C${startDate}%2C${endDate}&sort=timeStamp`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }
}

export default LightspeedRetailSDK;
