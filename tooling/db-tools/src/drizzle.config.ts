import "./inject-env";

import path from "path";

import { defineConfig } from "drizzle-kit";

const worksapceRoot = path.resolve(process.cwd(), "..", "..");

const sharedDatabaseRoot = path.join(
  worksapceRoot,
  "packages",
  "shared-database",
);

const sqlSchemaPath = path
  .join(sharedDatabaseRoot, "src", "**", "*.ts")
  .replace(/\\/g, "/");

export default defineConfig({
  out: "./migrations",
  schema: [sqlSchemaPath],
  dialect: "postgresql",
  dbCredentials: {
    host: process.env["DATABASE_HOST"]!,
    port: Number(process.env["DATABASE_PORT"]!),
    user: process.env["DATABASE_USER"]!,
    password: process.env["DATABASE_PASSWORD"]!,
    database: process.env["DATABASE_NAME"]!,
  },
  breakpoints: false,
});
