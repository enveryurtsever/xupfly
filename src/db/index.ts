import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Prevent multiple connections in development (Next.js hot reload)
const globalForDb = globalThis as unknown as { connection: postgres.Sql };

const dbUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const connection =
  globalForDb.connection ??
  postgres(dbUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.connection = connection;

export const db = drizzle(connection, { schema });
export type DB = typeof db;
