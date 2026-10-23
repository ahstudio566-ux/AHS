import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectionString = 
  process.env.HYPERDRIVE_CONNECTION_STRING || 
  process.env.DATABASE_URL || 
  process.env.SQL_CONNECTION_STRING;

const dbCredentialsConfig = connectionString 
  ? { url: connectionString }
  : {
      host: process.env.SQL_HOST || "",
      user: process.env.SQL_ADMIN_USER || "",
      password: process.env.SQL_ADMIN_PASSWORD || "",
      database: process.env.SQL_DB_NAME || "",
      ssl: false,
    };

if (!connectionString) {
  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_ADMIN_PASSWORD;

  if (!sqlHost) {
    throw new Error("SQL_HOST or a valid database connection string (DATABASE_URL / SQL_CONNECTION_STRING / HYPERDRIVE_CONNECTION_STRING) must be set in environment variables.");
  }
  if (!sqlDbName) {
    throw new Error("SQL_DB_NAME must be set in environment variables.");
  }
  if (!user) {
    throw new Error("SQL_ADMIN_USER must be set in environment variables.");
  }
  if (!password) {
    throw new Error("SQL_ADMIN_PASSWORD must be set in environment variables.");
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: dbCredentialsConfig,
  verbose: true,
});
