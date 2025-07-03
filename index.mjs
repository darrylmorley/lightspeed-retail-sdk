import { LightspeedSDKCore } from "./src/core/LightspeedSDK.mjs";
import {
  InMemoryTokenStorage,
  FileTokenStorage,
  DatabaseTokenStorage,
} from "./src/storage/TokenStorage.mjs";

class LightspeedRetailSDK extends LightspeedSDKCore {
  constructor(opts) {
    super(opts, InMemoryTokenStorage);
  }

  /**
   * Fetches account info for the current accountID.
   * @param {string[]} [relations] - Optional relations to load (array or comma-separated string)
   * @returns {Promise<Object>} Account info object from Lightspeed API
   */
  async getAccount(relations) {
    let url = `${this.baseUrl}/${this.accountID}.json`;
    if (relations) {
      const relStr = Array.isArray(relations) ? relations.join(",") : relations;
      url += `?load_relations=${relStr}`;
    }
    const options = {
      url,
      method: "GET",
    };
    try {
      const response = await this.executeApiRequest(options);
      // The API may return { data: { Account: {...} } } or just { Account: {...} }
      if (response?.data?.Account) return response.data;
      if (response?.Account) return response;
      return response;
    } catch (error) {
      return this.handleError("GET ACCOUNT ERROR", error);
    }
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

  async putCustomer(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a customerID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT CUSTOMER ERROR", error);
    }
  }

  async postCustomer(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST CUSTOMER ERROR", error);
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
  async getItems(relations, limit = null) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
    };

    const searchParams = new URLSearchParams();

    if (relations) {
      searchParams.append("load_relations", relations);
    }

    if (limit) {
      searchParams.append("limit", Math.min(limit, 100));
    }

    const queryString = searchParams.toString();
    if (queryString) {
      options.url += `?${queryString}`;
    }

    try {
      if (limit) {
        // Single page request
        const response = await this.executeApiRequest(options);

        // Handle different response structures
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
        // All pages request
        const response = await this.getAllData(options);
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error);
    }
  }

  // Create a new item
  async postItem(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST ITEM ERROR", error);
    }
  }

  // Get all items by vendor
  async getVendorItems(vendorID, relations) {
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

  // Update Matrix Item by ID
  async putMatrixItem(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a itemID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT ITEM ERROR", error);
    }
  }

  // Create a new Matrix Item
  async postMatrixItem(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemMatrix.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST ITEM ERROR", error);
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

  async putCategory(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a categoryID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT CATEGORY ERROR", error);
    }
  }

  // Create a new category
  async postCategory(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST CATEGORY ERROR", error);
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

  // Update Manufacturer by ID
  async putManufacturer(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a manufacturerID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT MANUFACTURER ERROR", error);
    }
  }

  // Create a new Manufacturer
  async postManufacturer(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST MANUFACTURER ERROR", error);
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

  // Update vendor by ID
  async putVendor(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a vendorID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT VENDOR ERROR", error);
    }
  }

  async postVendor(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST VENDOR ERROR", error);
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

  async getMultipleSales(saleIDs, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json?saleID=IN,${saleIDs}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Update sale by ID
  async putSale(id, data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale/${id}.json`,
      method: "PUT",
      data,
    };

    if (!id) return this.handleError("You need to provide a saleID");
    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("PUT SALE ERROR", error);
    }
  }

  // Create a new sale
  async postSale(data) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "POST",
      data,
    };

    if (!data) return this.handleError("You need to provide data");

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("POST SALE ERROR", error);
    }
  }

  // Get sale lines by itemID
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
  async getSaleLinesByItems(
    ids,
    startDate = undefined,
    endDate = undefined,
    relations
  ) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SaleLine.json?itemID=IN,[${ids}]`,
      method: "GET",
    };

    if (!ids) return this.handleError("You need to provide itemIDs");
    if (startDate && !endDate)
      return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    if (startDate && endDate)
      options.url =
        options.url +
        `&timeStamp=%3E%3C%2C${startDate}%2C${endDate}&sort=timeStamp`;

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
    if (startDate && !endDate)
      return this.handleError("You need to provide an end date");
    if (endDate && !startDate)
      return this.handleError("You need to provide a start date");

    if (startDate && endDate)
      options.url =
        options.url +
        `&timeStamp=%3E%3C%2C${startDate}%2C${endDate}&sort=timeStamp`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALE ERROR", error);
    }
  }

  // Fetch all Credit Accounts
  async getGiftCards(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CreditAccount.json?giftCard=true`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CREDIT ACCOUNTS ERROR", error);
    }
  }

  // Fetch a Credit Account by ID
  async getGiftCard(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CreditAccount.json?giftCard=true&code=${id}`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide a gift card code");

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CREDIT ACCOUNT ERROR", error);
    }
  }

  // Get special orders
  async getSpecialOrders(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/SpecialOrder.json?completed=0`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SPECIAL ORDER ERROR", error);
    }
  }

  async getImages(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Image.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET IMAGES ERROR", error);
    }
  }

  // Post an image
  async postImage(imageFilePath, metadata) {
    if (!imageFilePath)
      return this.handleError("You need to provide an image file path");
    if (!metadata || (!metadata.itemID && !metadata.itemMatrixID)) {
      return this.handleError(
        "You need to provide metadata with either itemID or itemMatrixID"
      );
    }

    // Import required modules dynamically
    const FormData = (await import("form-data")).default;
    const fs = (await import("fs")).default;
    const path = (await import("path")).default;

    // Create form data object
    const formData = new FormData();

    // Add the metadata as JSON string to the 'data' field
    formData.append("data", JSON.stringify(metadata));

    // Get filename from path
    const filename = path.basename(imageFilePath);

    // Add the image file to the form
    formData.append("image", fs.createReadStream(imageFilePath), {
      filename,
      contentType: this.getContentType(filename),
    });

    const token = await this.getToken();
    if (!token) throw new Error("Error Fetching Token");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Image.json`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      },
      data: formData,
    };

    try {
      const response = await axios(options);
      return response.data;
    } catch (error) {
      return this.handleError("POST IMAGE ERROR", error);
    }
  }

  // Shop/Account information
  async getAccount(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("GET ACCOUNT ERROR", error);
    }
  }

  // Get all employees
  async getEmployees(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET EMPLOYEES ERROR", error);
    }
  }

  // Get employee by ID
  async getEmployee(id, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee/${id}.json`,
      method: "GET",
    };

    if (!id) return this.handleError("You need to provide an employeeID");
    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.executeApiRequest(options);
      return response;
    } catch (error) {
      return this.handleError("GET EMPLOYEE ERROR", error);
    }
  }

  // Customer Types
  async getCustomerTypes(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/CustomerType.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CUSTOMER TYPES ERROR", error);
    }
  }

  // Get all registers
  async getRegisters(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Register.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET REGISTERS ERROR", error);
    }
  }

  // Get Payment Types
  async getPaymentTypes(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/PaymentType.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET PAYMENT TYPES ERROR", error);
    }
  }

  // Get Tax Classes
  async getTaxClasses(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/TaxClass.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET TAX CLASSES ERROR", error);
    }
  }

  // Get Item Attributes
  async getItemAttributes(relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/ItemAttribute.json`,
      method: "GET",
    };

    if (relations) options.url = options.url + `?load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ATTRIBUTES ERROR", error);
    }
  }

  // Search items
  async searchItems(searchTerm, relations) {
    const options = {
      url: `${this.baseUrl}/${
        this.accountID
      }/Item.json?description=~,${encodeURIComponent(searchTerm)}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("SEARCH ITEMS ERROR", error);
    }
  }

  // Search customers
  async searchCustomers(searchTerm, relations) {
    const encodedTerm = encodeURIComponent(searchTerm);
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json?or=firstName=~,${encodedTerm}||lastName=~,${encodedTerm}||email=~,${encodedTerm}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("SEARCH CUSTOMERS ERROR", error);
    }
  }

  // Get sales by date range
  async getSalesByDateRange(startDate, endDate, relations) {
    if (!startDate || !endDate) {
      return this.handleError("You need to provide both start and end dates");
    }

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json?timeStamp=%3E%3C%2C${startDate}%2C${endDate}&sort=timeStamp`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET SALES BY DATE RANGE ERROR", error);
    }
  }

  // Get items by category
  async getItemsByCategory(categoryId, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json?categoryID=${categoryId}`,
      method: "GET",
    };

    if (!categoryId)
      return this.handleError("You need to provide a categoryID");
    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS BY CATEGORY ERROR", error);
    }
  }

  // Get low stock items
  async getItemsWithLowStock(threshold = 5, relations) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json?qoh=<,${threshold}`,
      method: "GET",
    };

    if (relations) options.url = options.url + `&load_relations=${relations}`;

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET LOW STOCK ITEMS ERROR", error);
    }
  }

  // Bulk operations
  async updateMultipleItems(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      return this.handleError("You need to provide an array of item updates");
    }

    const results = [];
    for (const update of updates) {
      if (!update.itemID || !update.data) {
        results.push({ error: "Missing itemID or data", update });
        continue;
      }

      try {
        const result = await this.putItem(update.itemID, update.data);
        results.push({ success: true, itemID: update.itemID, result });
      } catch (error) {
        results.push({ error: error.message, itemID: update.itemID });
      }
    }

    return results;
  }

  // Helper method for content type detection (for image uploads)
  getContentType(filename) {
    const ext = filename.toLowerCase().split(".").pop();
    const contentTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return contentTypes[ext] || "application/octet-stream";
  }
}

export default LightspeedRetailSDK;
export { FileTokenStorage, InMemoryTokenStorage, DatabaseTokenStorage };
