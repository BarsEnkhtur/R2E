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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompletedTask = z.infer<typeof insertCompletedTaskSchema>;
export type CompletedTask = typeof completedTasks.$inferSelect;
