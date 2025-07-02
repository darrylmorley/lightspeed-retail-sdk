const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Building Lightspeed Retail SDK...\n");

try {
  // Clean dist folder
  console.log("🧹 Cleaning dist folder...");
  execSync("npm run clean", { stdio: "inherit" });

  // Create dist directories
  console.log("📁 Creating dist directories...");
  execSync("npm run prebuild", { stdio: "inherit" });

  // Copy source ESM files to dist
  console.log("📄 Copying ESM source files...");
  execSync("cp -r src dist/", { stdio: "inherit" });
  execSync("cp index.mjs dist/", { stdio: "inherit" });

  // Build CommonJS versions
  console.log("🔄 Transpiling to CommonJS...");
  execSync("npm run build:core", { stdio: "inherit" });
  execSync("npm run build:storage", { stdio: "inherit" });
  execSync("npm run build:main", { stdio: "inherit" });

  // Update require paths in CommonJS files
  console.log("🔧 Fixing CommonJS import paths...");
  const cjsFiles = ["dist/index.cjs", "dist/core/LightspeedSDK.cjs"];

  cjsFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, "utf8");
      // Fix relative paths for CommonJS
      content = content.replace(/require\("\.\/src\//g, 'require("./');
      content = content.replace(
        /require\("\.\.\/storage\//g,
        'require("../storage/'
      );
      fs.writeFileSync(file, content);
    }
  });

  console.log("\n✅ Build complete!");
  console.log("\n📦 Distribution files:");
  console.log("   dist/index.mjs (ESM)");
  console.log("   dist/index.cjs (CommonJS)");
  console.log("   dist/core/ (Core SDK files)");
  console.log("   dist/storage/ (Storage classes)");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
