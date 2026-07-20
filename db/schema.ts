import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const machines = sqliteTable("machines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  chassis: text("chassis").notNull(),
  body: text("body").notNull().default(""),
  motor: text("motor").notNull().default(""),
  motorRpm: integer("motor_rpm").notNull().default(20000),
  gearRatio: real("gear_ratio").notNull().default(4),
  tireDiameter: real("tire_diameter").notNull().default(26),
  weight: real("weight").notNull().default(0),
  frontParts: text("front_parts").notNull().default("[]"),
  sideParts: text("side_parts").notNull().default("[]"),
  rearParts: text("rear_parts").notNull().default("[]"),
  internalParts: text("internal_parts").notNull().default("[]"),
  detectedParts: text("detected_parts").notNull().default("[]"),
  photoKeys: text("photo_keys").notNull().default("{}"),
  memo: text("memo").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
