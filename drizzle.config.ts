import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import type { MigrationConfig } from "drizzle-orm/migrator";

const dbUrl = process.env.DB_URL;

if (!dbUrl) {
  throw new Error("Missing required environment variable: DB_URL");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};
