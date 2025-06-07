import { users, completedTasks, type User, type InsertUser, type CompletedTask, type InsertCompletedTask } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCompletedTasks(): Promise<CompletedTask[]>;
  createCompletedTask(task: InsertCompletedTask): Promise<CompletedTask>;
  deleteCompletedTask(id: number): Promise<void>;
  clearAllCompletedTasks(): Promise<void>;
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
}

export const storage = new DatabaseStorage();
