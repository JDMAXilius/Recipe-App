import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "./env.js";
import * as schema from "../db/schema.js";

// prepare: false is required for Supabase's transaction-mode pooler
const sql = postgres(ENV.DATABASE_URL, { prepare: false });
export const db = drizzle(sql, { schema });
