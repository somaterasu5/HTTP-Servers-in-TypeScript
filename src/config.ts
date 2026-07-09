import "dotenv/config";

function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

type APIConfig = {
  fileserverHits: number;
  port: number;
  platform: string;
};

type DBConfig = {
  url: string;
  migrationConfig: {
    migrationsFolder: string;
  };
};

type Config = {
  db: DBConfig;
  api: APIConfig;
};

const config: Config = {
  api: {
    fileserverHits: 0,
    port: 8080,
    platform: envOrThrow("PLATFORM"),
  },
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: { migrationsFolder: "./src/db/migrations" },
  },
};

export default config;
