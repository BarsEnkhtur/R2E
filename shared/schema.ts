import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  timestamp,
  real,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  profileImageUrl: text("profile_image_url"),
  emailNotifications: boolean("email_notifications").default(true),
  weeklyDigest: boolean("weekly_digest").default(true),
  taskReminders: boolean("task_reminders").default(false),
  achievementAlerts: boolean("achievement_alerts").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const completedTasks = pgTable("completed_tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  taskId: text("task_id").notNull(),
  name: text("name").notNull(),
  points: real("points").notNull(),
  note: text("note"),
  microFeedback: text("micro_feedback"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  weekStartDate: text("week_start_date").notNull(),
});

export const taskStats = pgTable("task_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  taskId: text("task_id").notNull(),
  taskName: text("task_name").notNull(),
  basePoints: real("base_points").notNull(),
  currentValue: real("current_value").notNull(),
  timesThisWeek: integer("times_this_week").notNull().default(0),
  lastCompleted: timestamp("last_completed"),
  weekStartDate: text("week_start_date").notNull(),
});

export const weeklyHistory = pgTable("weekly_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  weekStartDate: text("week_start_date").notNull(),
  totalPoints: real("total_points").notNull().default(0),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  weeklyGoal: real("weekly_goal").notNull().default(15),
  goalAchieved: boolean("goal_achieved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customTasks = pgTable("custom_tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  taskId: text("task_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  points: real("points").notNull(),
  icon: text("icon").notNull().default("Circle"),
  color: text("color").notNull().default("blue"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI-generated badges based on user task patterns
export const aiBadges = pgTable("ai_badges", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  badgeId: text("badge_id").notNull(), // AI-generated unique identifier
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji or icon identifier
  color: text("color").notNull().default("blue"),
  category: text("category").notNull(), // e.g., "synergy", "balance", "streak", "legendary"
  tier: text("tier"), // "Bronze", "Silver", "Gold", "Legendary"
  criteria: text("criteria").notNull(), // human-readable criteria
  taskPatterns: jsonb("task_patterns"), // AI analysis of task patterns that triggered this badge
  xpReward: integer("xp_reward").default(0), // XP points awarded for earning this badge
  rarity: text("rarity").default("common"), // "common", "rare", "epic", "legendary"
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  isVisible: boolean("is_visible").notNull().default(true),
});

// Public shares table for read-only snapshots
export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id),
  weekStartDate: text("week_start_date").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(), // Snapshot of week's data
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  displayName: true,
  profileImageUrl: true,
  emailNotifications: true,
  weeklyDigest: true,
  taskReminders: true,
  achievementAlerts: true,
});

export const insertCompletedTaskSchema = createInsertSchema(completedTasks).pick({
  userId: true,
  taskId: true,
  name: true,
  points: true,
  note: true,
  weekStartDate: true,
});

export const insertShareSchema = createInsertSchema(shares).pick({
  token: true,
  userId: true,
  weekStartDate: true,
  title: true,
  description: true,
  data: true,
  expiresAt: true,
});

export const insertTaskStatsSchema = createInsertSchema(taskStats).pick({
  userId: true,
  taskId: true,
  taskName: true,
  basePoints: true,
  currentValue: true,
  timesThisWeek: true,
  lastCompleted: true,
  weekStartDate: true,
});

export const insertWeeklyHistorySchema = createInsertSchema(weeklyHistory).pick({
  userId: true,
  weekStartDate: true,
  totalPoints: true,
  tasksCompleted: true,
  weeklyGoal: true,
  goalAchieved: true,
});

export const insertCustomTaskSchema = createInsertSchema(customTasks).pick({
  userId: true,
  taskId: true,
  name: true,
  description: true,
  points: true,
  icon: true,
  color: true,
  isActive: true,
});

export const insertAiBadgeSchema = createInsertSchema(aiBadges).pick({
  userId: true,
  badgeId: true,
  name: true,
  description: true,
  icon: true,
  color: true,
  category: true,
  tier: true,
  criteria: true,
  taskPatterns: true,
  xpReward: true,
  rarity: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompletedTask = z.infer<typeof insertCompletedTaskSchema>;
export type CompletedTask = typeof completedTasks.$inferSelect;
export type InsertTaskStats = z.infer<typeof insertTaskStatsSchema>;
export type TaskStats = typeof taskStats.$inferSelect;
export type InsertWeeklyHistory = z.infer<typeof insertWeeklyHistorySchema>;
export type WeeklyHistory = typeof weeklyHistory.$inferSelect;
export type InsertCustomTask = z.infer<typeof insertCustomTaskSchema>;
export type CustomTask = typeof customTasks.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;
export type Share = typeof shares.$inferSelect;
export type InsertAiBadge = z.infer<typeof insertAiBadgeSchema>;
export type AiBadge = typeof aiBadges.$inferSelect;
