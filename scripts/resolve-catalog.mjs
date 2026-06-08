import fs from "fs";

const catalog = JSON.parse(fs.readFileSync("package.json", "utf8")).workspaces.catalog;

const dirs = [
  "apps/telegram-agent",
  "packages/shared", "packages/cqrs", "packages/logger", "packages/http",
  "packages/shared-database",
  "tooling/build-tools", "tooling/common-eslint", "tooling/common-tsconfig",
  "tooling/db-tools", "tooling/nats-tools",
];

for (const dir of dirs) {
  const p = `${dir}/package.json`;
  if (!fs.existsSync(p)) continue;
  const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
    for (const key of Object.keys(pkg[section] || {})) {
      const val = pkg[section][key];
      if (val === "catalog:") pkg[section][key] = catalog[key];
      if (val.startsWith("workspace:")) pkg[section][key] = "*";
    }
  }
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
  console.log(`resolved: ${p}`);
}

console.log("catalog: entries resolved");
