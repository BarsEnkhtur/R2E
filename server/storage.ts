import { users, completedTasks, taskStats, weeklyHistory, customTasks, type User, type InsertUser, type CompletedTask, type InsertCompletedTask, type TaskStats, type InsertTaskStats, type WeeklyHistory, type InsertWeeklyHistory, type CustomTask, type InsertCustomTask } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCompletedTasks(weekStartDate?: string): Promise<CompletedTask[]>;
  createCompletedTask(task: InsertCompletedTask): Promise<CompletedTask>;
  updateCompletedTask(id: number, updates: Partial<CompletedTask>): Promise<CompletedTask>;
  deleteCompletedTask(id: number): Promise<void>;
  clearAllCompletedTasks(weekStartDate?: string): Promise<void>;
  getTaskStats(weekStartDate: string): Promise<TaskStats[]>;
  getTaskStatByTaskId(taskId: string, weekStartDate: string): Promise<TaskStats | undefined>;
  createTaskStats(stats: InsertTaskStats): Promise<TaskStats>;
  updateTaskStats(taskId: string, weekStartDate: string, updates: Partial<TaskStats>): Promise<TaskStats>;
  getWeeklyHistory(): Promise<WeeklyHistory[]>;
  createOrUpdateWeeklyHistory(weekData: InsertWeeklyHistory): Promise<WeeklyHistory>;
  calculateDynamicGoal(weekStartDate: string): Promise<number>;
  getCustomTasks(): Promise<CustomTask[]>;
  createCustomTask(task: InsertCustomTask): Promise<CustomTask>;
  updateCustomTask(id: number, updates: Partial<CustomTask>): Promise<CustomTask>;
  deleteCustomTask(id: number): Promise<void>;
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

  async updateCompletedTask(id: number, updates: Partial<CompletedTask>): Promise<CompletedTask> {
    const [updatedTask] = await db
      .update(completedTasks)
      .set(updates)
      .where(eq(completedTasks.id, id))
      .returning();
    return updatedTask;
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
      const goalAchieved = (weekData.totalPoints || 0) >= (weekData.weeklyGoal || existing.weeklyGoal);
      const [updated] = await db
        .update(weeklyHistory)
        .set({
          totalPoints: weekData.totalPoints || 0,
          tasksCompleted: weekData.tasksCompleted || 0,
          weeklyGoal: weekData.weeklyGoal || existing.weeklyGoal,
          goalAchieved: goalAchieved,
        })
        .where(eq(weeklyHistory.weekStartDate, weekData.weekStartDate))
        .returning();
      return updated;
    } else {
      const goalAchieved = (weekData.totalPoints || 0) >= (weekData.weeklyGoal || 15);
      const [created] = await db
        .insert(weeklyHistory)
        .values({
          ...weekData,
          weeklyGoal: weekData.weeklyGoal || 15,
          goalAchieved: goalAchieved,
        })
        .returning();
      return created;
    }
  }

  async calculateDynamicGoal(weekStartDate: string): Promise<number> {
    // Get the last 3 weeks of history for rolling average
    const history = await db
      .select()
      .from(weeklyHistory)
      .where(lt(weeklyHistory.weekStartDate, weekStartDate))
      .orderBy(desc(weeklyHistory.weekStartDate))
      .limit(3);

    if (history.length === 0) {
      return 15; // Default goal for first week
    }

    if (history.length === 1) {
      const lastWeek = history[0];
      const performance = lastWeek.totalPoints / lastWeek.weeklyGoal;
      
      if (performance >= 1.1) {
        return Math.round(lastWeek.totalPoints * 1.1 * 2) / 2; // 10% increase, rounded to nearest 0.5
      } else if (performance < 0.7) {
        return Math.max(10, Math.round(lastWeek.weeklyGoal * 0.9 * 2) / 2); // 10% decrease, min 10
      } else {
        return lastWeek.weeklyGoal;
      }
    }

    // Calculate rolling average of last 2-3 weeks
    const recentWeeks = history.slice(0, 2);
    const averagePoints = recentWeeks.reduce((sum, week) => sum + week.totalPoints, 0) / recentWeeks.length;
    const averageGoal = recentWeeks.reduce((sum, week) => sum + week.weeklyGoal, 0) / recentWeeks.length;
    
    const overallPerformance = averagePoints / averageGoal;
    let newGoal = averagePoints;
    
    if (overallPerformance >= 1.1) {
      newGoal = averagePoints * 1.1; // 10% increase for consistent overperformance
    } else if (overallPerformance < 0.7) {
      newGoal = Math.max(10, averageGoal * 0.9); // 10% decrease for underperformance
    }
    
    return Math.round(newGoal * 2) / 2; // Round to nearest 0.5
  }

  async getCustomTasks(): Promise<CustomTask[]> {
    return await db
      .select()
      .from(customTasks)
      .where(eq(customTasks.isActive, true))
      .orderBy(desc(customTasks.createdAt));
  }

  async createCustomTask(task: InsertCustomTask): Promise<CustomTask> {
    const [created] = await db
      .insert(customTasks)
      .values(task)
      .returning();
    return created;
  }

  async updateCustomTask(id: number, updates: Partial<CustomTask>): Promise<CustomTask> {
    const [updated] = await db
      .update(customTasks)
      .set(updates)
      .where(eq(customTasks.id, id))
      .returning();
    return updated;
  }

  async deleteCustomTask(id: number): Promise<void> {
    await db
      .update(customTasks)
      .set({ isActive: false })
      .where(eq(customTasks.id, id));
  }
}

export const storage = new DatabaseStorage();
