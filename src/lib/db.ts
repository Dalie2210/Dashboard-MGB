import { Pool } from "pg";

declare global {
  var __sacPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
  });
}

export const pool = globalThis.__sacPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__sacPool = pool;
}
