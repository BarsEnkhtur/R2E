import { users, completedTasks, taskStats, type User, type InsertUser, type CompletedTask, type InsertCompletedTask, type TaskStats, type InsertTaskStats } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCompletedTasks(): Promise<CompletedTask[]>;
  createCompletedTask(task: InsertCompletedTask): Promise<CompletedTask>;
  deleteCompletedTask(id: number): Promise<void>;
  clearAllCompletedTasks(): Promise<void>;
  getTaskStats(weekOfYear: number, year: number): Promise<TaskStats[]>;
  getTaskStatByTaskId(taskId: string, weekOfYear: number, year: number): Promise<TaskStats | undefined>;
  createTaskStats(stats: InsertTaskStats): Promise<TaskStats>;
  updateTaskStats(taskId: string, updates: Partial<TaskStats>): Promise<TaskStats>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCompletedTasks(): Promise<CompletedTask[]> {
    return await db
      .select()
      .from(completedTasks)
      .orderBy(desc(completedTasks.completedAt));
  }

  async createCompletedTask(task: InsertCompletedTask): Promise<CompletedTask> {
    const [createdTask] = await db
      .insert(completedTasks)
      .values(task)
      .returning();
    return createdTask;
  }

  async deleteCompletedTask(id: number): Promise<void> {
    await db.delete(completedTasks).where(eq(completedTasks.id, id));
  }

  async clearAllCompletedTasks(): Promise<void> {
    await db.delete(completedTasks);
  }

  async getTaskStats(weekOfYear: number, year: number): Promise<TaskStats[]> {
    return await db
      .select()
      .from(taskStats)
      .where(and(eq(taskStats.weekOfYear, weekOfYear), eq(taskStats.year, year)));
  }

  async getTaskStatByTaskId(taskId: string, weekOfYear: number, year: number): Promise<TaskStats | undefined> {
    const [stat] = await db
      .select()
      .from(taskStats)
      .where(and(
        eq(taskStats.taskId, taskId),
        eq(taskStats.weekOfYear, weekOfYear),
        eq(taskStats.year, year)
      ));
    return stat || undefined;
  }

  async createTaskStats(stats: InsertTaskStats): Promise<TaskStats> {
    const [created] = await db
      .insert(taskStats)
      .values(stats)
      .returning();
    return created;
  }

  async updateTaskStats(taskId: string, updates: Partial<TaskStats>): Promise<TaskStats> {
    const [updated] = await db
      .update(taskStats)
      .set(updates)
      .where(eq(taskStats.taskId, taskId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
