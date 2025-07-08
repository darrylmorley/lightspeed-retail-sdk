import { LightspeedSDKCore } from "./src/core/LightspeedSDK.mjs";
import {
  InMemoryTokenStorage,
  FileTokenStorage,
  EncryptedTokenStorage,
  DatabaseTokenStorage,
} from "./src/storage/TokenStorage.mjs";

import AccountEndpoint from "./src/endpoints/account.js";
import CategoryEndpoint from "./src/endpoints/category.js";
import CustomerEndpoint from "./src/endpoints/customer.js";
import CustomerTypeEndpoint from "./src/endpoints/customertype.js";
import EmployeeEndpoint from "./src/endpoints/employee.js";
import GiftCardEndpoint from "./src/endpoints/giftcard.js";
import ImageEndpoint from "./src/endpoints/image.js";
import ItemEndpoint from "./src/endpoints/item.js";
import ItemAttributeEndpoint from "./src/endpoints/itemattribute.js";
import ManufacturerEndpoint from "./src/endpoints/manufacturer.js";
import MatrixEndpoint from "./src/endpoints/matrix.js";
import OrderEndpoint from "./src/endpoints/order.js";
import PaymentTypeEndpoint from "./src/endpoints/paymenttype.js";
import RegisterEndpoint from "./src/endpoints/register.js";
import SaleEndpoint from "./src/endpoints/sale.js";
import SaleLineEndpoint from "./src/endpoints/saleline.js";
import SpecialOrderEndpoint from "./src/endpoints/specialorder.js";
import TaxClassEndpoint from "./src/endpoints/taxclass.js";
import VendorEndpoint from "./src/endpoints/vendor.js";

class LightspeedRetailSDK extends LightspeedSDKCore {
  constructor(opts) {
    super(opts, InMemoryTokenStorage);

    // Instantiate endpoints
    this.account = new AccountEndpoint(this);
    this.category = new CategoryEndpoint(this);
    this.customer = new CustomerEndpoint(this);
    this.customerType = new CustomerTypeEndpoint(this);
    this.employee = new EmployeeEndpoint(this);
    this.giftCard = new GiftCardEndpoint(this);
    this.image = new ImageEndpoint(this);
    this.item = new ItemEndpoint(this);
    this.itemAttribute = new ItemAttributeEndpoint(this);
    this.manufacturer = new ManufacturerEndpoint(this);
    this.matrix = new MatrixEndpoint(this);
    this.order = new OrderEndpoint(this);
    this.paymentType = new PaymentTypeEndpoint(this);
    this.register = new RegisterEndpoint(this);
    this.sale = new SaleEndpoint(this);
    this.saleLine = new SaleLineEndpoint(this);
    this.specialOrder = new SpecialOrderEndpoint(this);
    this.taxClass = new TaxClassEndpoint(this);
    this.vendor = new VendorEndpoint(this);

    // Proxy all endpoint methods to the SDK instance (top-level)
    const endpoints = [
      this.account,
      this.category,
      this.customer,
      this.customerType,
      this.employee,
      this.giftCard,
      this.image,
      this.item,
      this.itemAttribute,
      this.manufacturer,
      this.matrix,
      this.order,
      this.paymentType,
      this.register,
      this.sale,
      this.saleLine,
      this.specialOrder,
      this.taxClass,
      this.vendor,
    ];
    for (const endpoint of endpoints) {
      for (const key of Object.getOwnPropertyNames(
        Object.getPrototypeOf(endpoint)
      )) {
        if (key !== "constructor" && typeof endpoint[key] === "function") {
          if (!this[key]) {
            this[key] = endpoint[key].bind(endpoint);
          }
        }
      }
    }
  }
}

export default LightspeedRetailSDK;
export {
  FileTokenStorage,
  InMemoryTokenStorage,
  EncryptedTokenStorage,
  DatabaseTokenStorage,
};
