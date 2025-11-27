import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import pgPkg from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const dbHost = new URL(connectionString).hostname;
const useLocalPg = dbHost === "localhost" || dbHost === "127.0.0.1";

const { Pool: PgPool } = pgPkg;

let pool: InstanceType<typeof PgPool> | NeonPool;
let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleNeon>;

if (useLocalPg) {
  pool = new PgPool({ connectionString });
  db = drizzlePg(pool, { schema });
} else {
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString });
  db = drizzleNeon({ client: pool, schema });
}

export { pool, db };
