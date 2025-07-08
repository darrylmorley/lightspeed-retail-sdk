class EmployeeEndpoint {
  constructor(sdk) {
    this.baseUrl = sdk.baseUrl;
    this.accountID = sdk.accountID;
    this.handleError = sdk.handleError.bind(sdk);
    this.getAllData = sdk.getAllData.bind(sdk);
    this.executeApiRequest = sdk.executeApiRequest.bind(sdk);
  }

  // Get all employees
  async getEmployees(params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee.json`,
      method: "GET",
      params,
    };

    try {
      const response = await this.getAllData(options);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET EMPLOYEES ERROR", error, false);
      return [];
    }
  }

  // Get employee by ID
  async getEmployee(id, params = {}) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee/${id}.json`,
      method: "GET",
      params,
    };
    try {
      const response = await this.getAllData(options);
      // If response is a single object, wrap in array
      if (response && !Array.isArray(response)) {
        return [response];
      }
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.handleError("GET EMPLOYEE ERROR", error, false);
      return [];
    }
  }

  // Create a new employee
  async createEmployee(data) {
    if (!data) return this.handleError("You need to provide employee data");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee.json`,
      method: "POST",
      data,
    };

    try {
      const response = await this.executeApiRequest(options);
      return response || {};
    } catch (error) {
      this.handleError("CREATE EMPLOYEE ERROR", error, false);
      return {};
    }
  }

  // Update an existing employee
  async updateEmployee(id, data) {
    if (!id) return this.handleError("You need to provide an employee ID");
    if (!data) return this.handleError("You need to provide employee data");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee/${id}.json`,
      method: "PUT",
      data,
    };

    try {
      const response = await this.executeApiRequest(options);
      return response || {};
    } catch (error) {
      this.handleError("UPDATE EMPLOYEE ERROR", error, false);
      return {};
    }
  }

  // Delete an employee
  async deleteEmployee(id) {
    if (!id) return this.handleError("You need to provide an employee ID");

    const options = {
      url: `${this.baseUrl}/${this.accountID}/Employee/${id}.json`,
      method: "DELETE",
    };

    try {
      await this.executeApiRequest(options);
      return true;
    } catch (error) {
      this.handleError("DELETE EMPLOYEE ERROR", error, false);
      return false;
    }
  }
}

export default EmployeeEndpoint;
