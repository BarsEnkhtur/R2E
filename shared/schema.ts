import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
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
  points: real("points").notNull(),
  note: text("note"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  weekStartDate: text("week_start_date").notNull(),
});

export const taskStats = pgTable("task_stats", {
  id: serial("id").primaryKey(),
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
  weekStartDate: text("week_start_date").notNull().unique(),
  totalPoints: real("total_points").notNull().default(0),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  weekStartDate: true,
});

export const insertTaskStatsSchema = createInsertSchema(taskStats).pick({
  taskId: true,
  taskName: true,
  basePoints: true,
  currentValue: true,
  timesThisWeek: true,
  lastCompleted: true,
  weekStartDate: true,
});

export const insertWeeklyHistorySchema = createInsertSchema(weeklyHistory).pick({
  weekStartDate: true,
  totalPoints: true,
  tasksCompleted: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompletedTask = z.infer<typeof insertCompletedTaskSchema>;
export type CompletedTask = typeof completedTasks.$inferSelect;
export type InsertTaskStats = z.infer<typeof insertTaskStatsSchema>;
export type TaskStats = typeof taskStats.$inferSelect;
export type InsertWeeklyHistory = z.infer<typeof insertWeeklyHistorySchema>;
export type WeeklyHistory = typeof weeklyHistory.$inferSelect;
