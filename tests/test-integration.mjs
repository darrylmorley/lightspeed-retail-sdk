import LightspeedRetailSDK, { FileTokenStorage } from "../index.mjs";

const config = {
  accountID: process.env.LIGHTSPEED_ACCOUNT_ID,
  clientID: process.env.LIGHTSPEED_CLIENT_ID,
  clientSecret: process.env.LIGHTSPEED_CLIENT_SECRET,
  refreshToken: process.env.LIGHTSPEED_REFRESH_TOKEN,
  tokenStorage: new FileTokenStorage("./integration-tokens.json"),
};

const tests = [
  {
    name: "Get Account",
    test: (api) => api.getAccount(),
  },
  {
    name: "Get Customers",
    test: (api) => api.getCustomers(),
  },
  {
    name: "Get Items",
    test: (api) => api.getItems(),
  },
  {
    name: "Get Categories",
    test: (api) => api.getCategories(),
  },
  {
    name: "Search Items",
    test: (api) => api.searchItems("test"),
  },
  {
    name: "Get Low Stock Items",
    test: (api) => api.getItemsWithLowStock(5),
  },
];

async function runIntegrationTests() {
  console.log("🧪 Running Integration Tests\n");

  const api = new LightspeedRetailSDK(config);
  const results = [];

  for (const testCase of tests) {
    try {
      console.log(`Running: ${testCase.name}...`);
      const startTime = Date.now();

      const result = await testCase.test(api);
      const duration = Date.now() - startTime;

      console.log(`✅ ${testCase.name} - ${duration}ms`);
      results.push({ name: testCase.name, status: "PASS", duration });
    } catch (error) {
      console.log(`❌ ${testCase.name} - ${error.message}`);
      results.push({
        name: testCase.name,
        status: "FAIL",
        error: error.message,
      });
    }
  }

  console.log("\n📊 Test Results:");
  results.forEach((result) => {
    const status = result.status === "PASS" ? "✅" : "❌";
    console.log(`${status} ${result.name}: ${result.status}`);
  });

  const passed = results.filter((r) => r.status === "PASS").length;
  console.log(`\n${passed}/${results.length} tests passed`);
}

runIntegrationTests();
