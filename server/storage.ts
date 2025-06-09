import { users, completedTasks, taskStats, weeklyHistory, type User, type InsertUser, type CompletedTask, type InsertCompletedTask, type TaskStats, type InsertTaskStats, type WeeklyHistory, type InsertWeeklyHistory } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCompletedTasks(weekStartDate?: string): Promise<CompletedTask[]>;
  createCompletedTask(task: InsertCompletedTask): Promise<CompletedTask>;
  deleteCompletedTask(id: number): Promise<void>;
  clearAllCompletedTasks(weekStartDate?: string): Promise<void>;
  getTaskStats(weekStartDate: string): Promise<TaskStats[]>;
  getTaskStatByTaskId(taskId: string, weekStartDate: string): Promise<TaskStats | undefined>;
  createTaskStats(stats: InsertTaskStats): Promise<TaskStats>;
  updateTaskStats(taskId: string, weekStartDate: string, updates: Partial<TaskStats>): Promise<TaskStats>;
  getWeeklyHistory(): Promise<WeeklyHistory[]>;
  createOrUpdateWeeklyHistory(weekData: InsertWeeklyHistory): Promise<WeeklyHistory>;
  calculateDynamicGoal(weekStartDate: string): Promise<number>;
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

  async getCompletedTasks(weekStartDate?: string): Promise<CompletedTask[]> {
    const query = db.select().from(completedTasks);
    
    if (weekStartDate) {
      return await query
        .where(eq(completedTasks.weekStartDate, weekStartDate))
        .orderBy(desc(completedTasks.completedAt));
    }
    
    return await query.orderBy(desc(completedTasks.completedAt));
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

  async clearAllCompletedTasks(weekStartDate?: string): Promise<void> {
    if (weekStartDate) {
      await db.delete(completedTasks).where(eq(completedTasks.weekStartDate, weekStartDate));
    } else {
      await db.delete(completedTasks);
    }
  }

  async getTaskStats(weekStartDate: string): Promise<TaskStats[]> {
    return await db
      .select()
      .from(taskStats)
      .where(eq(taskStats.weekStartDate, weekStartDate));
  }

  async getTaskStatByTaskId(taskId: string, weekStartDate: string): Promise<TaskStats | undefined> {
    const [stat] = await db
      .select()
      .from(taskStats)
      .where(and(
        eq(taskStats.taskId, taskId),
        eq(taskStats.weekStartDate, weekStartDate)
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

  async updateTaskStats(taskId: string, weekStartDate: string, updates: Partial<TaskStats>): Promise<TaskStats> {
    const [updated] = await db
      .update(taskStats)
      .set(updates)
      .where(and(
        eq(taskStats.taskId, taskId),
        eq(taskStats.weekStartDate, weekStartDate)
      ))
      .returning();
    return updated;
  }

  async getWeeklyHistory(): Promise<WeeklyHistory[]> {
    return await db
      .select()
      .from(weeklyHistory)
      .orderBy(desc(weeklyHistory.weekStartDate));
  }

  async createOrUpdateWeeklyHistory(weekData: InsertWeeklyHistory): Promise<WeeklyHistory> {
    const [existing] = await db
      .select()
      .from(weeklyHistory)
      .where(eq(weeklyHistory.weekStartDate, weekData.weekStartDate));

    if (existing) {
      const [updated] = await db
        .update(weeklyHistory)
        .set({
          totalPoints: weekData.totalPoints,
          tasksCompleted: weekData.tasksCompleted
        })
        .where(eq(weeklyHistory.weekStartDate, weekData.weekStartDate))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(weeklyHistory)
        .values(weekData)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
