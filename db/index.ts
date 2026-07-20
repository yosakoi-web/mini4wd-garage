import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getRuntimeEnv } from "../lib/runtime-env";

type DatabaseBinding = Parameters<typeof drizzle>[0] & {
  prepare(query: string): { run(): Promise<unknown> };
};

let schemaReady: Promise<unknown> | null = null;

export function ensureDatabase() {
  const database = getRuntimeEnv().DB as DatabaseBinding | undefined;
  if (!database) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  schemaReady ??= database.prepare(`
    CREATE TABLE IF NOT EXISTS machines (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      chassis text NOT NULL,
      body text DEFAULT '' NOT NULL,
      motor text DEFAULT '' NOT NULL,
      motor_rpm integer DEFAULT 20000 NOT NULL,
      gear_ratio real DEFAULT 4 NOT NULL,
      tire_diameter real DEFAULT 26 NOT NULL,
      weight real DEFAULT 0 NOT NULL,
      front_parts text DEFAULT '[]' NOT NULL,
      side_parts text DEFAULT '[]' NOT NULL,
      rear_parts text DEFAULT '[]' NOT NULL,
      internal_parts text DEFAULT '[]' NOT NULL,
      detected_parts text DEFAULT '[]' NOT NULL,
      photo_keys text DEFAULT '{}' NOT NULL,
      memo text DEFAULT '' NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )
  `).run();
  return schemaReady;
}

export function getDb() {
  const database = getRuntimeEnv().DB as DatabaseBinding | undefined;
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(database, { schema });
}
