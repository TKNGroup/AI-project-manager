import "./inject-env";

import path from "path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

try {
  console.log("Migration start");

  const pool = new Pool({
    host: process.env["DATABASE_HOST"]!,
    port: Number(process.env["DATABASE_PORT"]!),
    user: process.env["DATABASE_USER"]!,
    password: process.env["DATABASE_PASSWORD"]!,
    database: process.env["DATABASE_NAME"]!,
    max: 1,
  });

  const db = drizzle({ client: pool, logger: true });

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "migrations"),
    migrationsSchema: "public",
    migrationsTable: "__migrations",
  });

  console.log("Migration up done");
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
