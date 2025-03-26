import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  telegramId: text("telegram_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  points: real("points").notNull().default(0),
  energy: integer("energy").notNull().default(50),
  maxEnergy: integer("max_energy").notNull().default(50),
  level: integer("level").notNull().default(1),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").notNull().default(0),
  walletAddress: text("wallet_address"),
  lastSeen: timestamp("last_seen").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

// Generators model
export const generators = pgTable("generators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  level: integer("level").notNull().default(1),
  baseOutput: real("base_output").notNull(),
  currentOutput: real("current_output").notNull(),
  upgradeCost: real("upgrade_cost").notNull(),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
});

// Active boosts model
export const activeBoosts = pgTable("active_boosts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  multiplier: real("multiplier").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

// Tasks model
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  reward: real("reward").notNull(),
  progress: real("progress").notNull().default(0),
  target: real("target").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull(),
});

// Game stats tracking
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalTaps: integer("total_taps").notNull().default(0),
  totalPointsEarned: real("total_points_earned").notNull().default(0),
  totalPointsSpent: real("total_points_spent").notNull().default(0),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  referralCount: true,
  createdAt: true,
});

export const insertGeneratorSchema = createInsertSchema(generators).omit({
  id: true,
});

export const insertActiveBoostSchema = createInsertSchema(activeBoosts).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertStatsSchema = createInsertSchema(stats).omit({
  id: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGenerator = z.infer<typeof insertGeneratorSchema>;
export type Generator = typeof generators.$inferSelect;

export type InsertActiveBoost = z.infer<typeof insertActiveBoostSchema>;
export type ActiveBoost = typeof activeBoosts.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertStats = z.infer<typeof insertStatsSchema>;
export type Stats = typeof stats.$inferSelect;

// Game item types
export enum GeneratorType {
  SATELLITE = "satellite",
  STATION = "station",
  MOON_BASE = "moon_base",
  COLONY = "colony",
}

export enum BoostType {
  DOUBLE_TAP = "double_tap",
  AUTO_BOOST = "auto_boost",
  ENERGY_REFILL = "energy_refill",
}

export enum TaskType {
  SOCIAL = "social",
  DAILY = "daily",
}

export enum UpgradeType {
  ENERGY_CAPACITY = "energy_capacity",
  MULTI_TAP = "multi_tap",
}

// User data with related entities
export interface UserWithRelated extends User {
  generators: Generator[];
  activeBoosts: ActiveBoost[];
  tasks: Task[];
  stats: Stats;
}
