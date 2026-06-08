import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Convert bun workspace format to npm workspace format
if (pkg.workspaces?.packages) {
  pkg.workspaces = pkg.workspaces.packages;
}

// Remove bun-specific fields
delete pkg.packageManager;

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
console.log("package.json converted for npm");
