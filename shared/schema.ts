import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const completedTasks = pgTable("completed_tasks", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull(),
  name: text("name").notNull(),
  points: integer("points").notNull(),
  note: text("note"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const taskStats = pgTable("task_stats", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull().unique(),
  taskName: text("task_name").notNull(),
  basePoints: integer("base_points").notNull(),
  currentValue: integer("current_value").notNull(),
  timesThisWeek: integer("times_this_week").notNull().default(0),
  lastCompleted: timestamp("last_completed"),
  weekOfYear: integer("week_of_year").notNull(),
  year: integer("year").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompletedTaskSchema = createInsertSchema(completedTasks).pick({
  taskId: true,
  name: true,
  points: true,
  note: true,
});

export const insertTaskStatsSchema = createInsertSchema(taskStats).pick({
  taskId: true,
  taskName: true,
  basePoints: true,
  currentValue: true,
  timesThisWeek: true,
  lastCompleted: true,
  weekOfYear: true,
  year: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompletedTask = z.infer<typeof insertCompletedTaskSchema>;
export type CompletedTask = typeof completedTasks.$inferSelect;
export type InsertTaskStats = z.infer<typeof insertTaskStatsSchema>;
export type TaskStats = typeof taskStats.$inferSelect;
