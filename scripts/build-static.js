const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "public");
const files = ["index.html", "styles.css", "app.js"];
const assetInput = path.join(root, "assets");
const assetOutput = path.join(output, "assets");

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}

if (fs.existsSync(assetInput)) {
  fs.cpSync(assetInput, assetOutput, { recursive: true });
}

console.log("Static app ready in public/");
