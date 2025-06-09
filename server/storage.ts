import { users, completedTasks, taskStats, weeklyHistory, customTasks, shares, type User, type UpsertUser, type CompletedTask, type InsertCompletedTask, type TaskStats, type InsertTaskStats, type WeeklyHistory, type InsertWeeklyHistory, type CustomTask, type InsertCustomTask, type Share, type InsertShare } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User-scoped data operations
  getCompletedTasks(userId: string, weekStartDate?: string): Promise<CompletedTask[]>;
  createCompletedTask(task: InsertCompletedTask): Promise<CompletedTask>;
  updateCompletedTask(id: number, updates: Partial<CompletedTask>): Promise<CompletedTask>;
  deleteCompletedTask(id: number): Promise<void>;
  clearAllCompletedTasks(userId: string, weekStartDate?: string): Promise<void>;
  getTaskStats(userId: string, weekStartDate: string): Promise<TaskStats[]>;
  getTaskStatByTaskId(userId: string, taskId: string, weekStartDate: string): Promise<TaskStats | undefined>;
  createTaskStats(stats: InsertTaskStats): Promise<TaskStats>;
  updateTaskStats(userId: string, taskId: string, weekStartDate: string, updates: Partial<TaskStats>): Promise<TaskStats>;
  getWeeklyHistory(userId: string): Promise<WeeklyHistory[]>;
  createOrUpdateWeeklyHistory(weekData: InsertWeeklyHistory): Promise<WeeklyHistory>;
  calculateDynamicGoal(userId: string, weekStartDate: string): Promise<number>;
  getCustomTasks(userId: string): Promise<CustomTask[]>;
  createCustomTask(task: InsertCustomTask): Promise<CustomTask>;
  updateCustomTask(id: number, updates: Partial<CustomTask>): Promise<CustomTask>;
  deleteCustomTask(id: number): Promise<void>;
  
  // Share operations
  createShare(share: InsertShare): Promise<Share>;
  getShare(token: string): Promise<Share | undefined>;
  getActiveShares(userId: string): Promise<Share[]>;
  deactivateShare(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getCompletedTasks(userId: string, weekStartDate?: string): Promise<CompletedTask[]> {
    let query = db.select().from(completedTasks).where(eq(completedTasks.userId, userId));
    
    if (weekStartDate) {
      query = db.select().from(completedTasks)
        .where(and(eq(completedTasks.userId, userId), eq(completedTasks.weekStartDate, weekStartDate)));
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

  async clearAllCompletedTasks(userId: string, weekStartDate?: string): Promise<void> {
    if (weekStartDate) {
      await db.delete(completedTasks).where(and(
        eq(completedTasks.userId, userId),
        eq(completedTasks.weekStartDate, weekStartDate)
      ));
    } else {
      await db.delete(completedTasks).where(eq(completedTasks.userId, userId));
    }
  }

  async getTaskStats(userId: string, weekStartDate: string): Promise<TaskStats[]> {
    return await db
      .select()
      .from(taskStats)
      .where(and(
        eq(taskStats.userId, userId),
        eq(taskStats.weekStartDate, weekStartDate)
      ));
  }

  async getTaskStatByTaskId(userId: string, taskId: string, weekStartDate: string): Promise<TaskStats | undefined> {
    const [stat] = await db
      .select()
      .from(taskStats)
      .where(and(
        eq(taskStats.userId, userId),
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

  async updateTaskStats(userId: string, taskId: string, weekStartDate: string, updates: Partial<TaskStats>): Promise<TaskStats> {
    const [updated] = await db
      .update(taskStats)
      .set(updates)
      .where(and(
        eq(taskStats.userId, userId),
        eq(taskStats.taskId, taskId),
        eq(taskStats.weekStartDate, weekStartDate)
      ))
      .returning();
    return updated;
  }

  async getWeeklyHistory(userId: string): Promise<WeeklyHistory[]> {
    return await db
      .select()
      .from(weeklyHistory)
      .where(eq(weeklyHistory.userId, userId))
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

  async calculateDynamicGoal(userId: string, weekStartDate: string): Promise<number> {
    // Get the last 3 weeks of history for rolling average
    const history = await db
      .select()
      .from(weeklyHistory)
      .where(and(
        eq(weeklyHistory.userId, userId),
        lt(weeklyHistory.weekStartDate, weekStartDate)
      ))
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

  async getCustomTasks(userId: string): Promise<CustomTask[]> {
    return await db
      .select()
      .from(customTasks)
      .where(and(
        eq(customTasks.userId, userId),
        eq(customTasks.isActive, true)
      ))
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

  // Share operations for public sharing system
  async createShare(share: InsertShare): Promise<Share> {
    const [created] = await db
      .insert(shares)
      .values(share)
      .returning();
    return created;
  }

  async getShare(token: string): Promise<Share | undefined> {
    const [share] = await db
      .select()
      .from(shares)
      .where(and(
        eq(shares.token, token),
        eq(shares.isActive, true)
      ));
    return share;
  }

  async getActiveShares(userId: string): Promise<Share[]> {
    return await db
      .select()
      .from(shares)
      .where(and(
        eq(shares.userId, userId),
        eq(shares.isActive, true)
      ))
      .orderBy(desc(shares.createdAt));
  }

  async deactivateShare(token: string): Promise<void> {
    await db
      .update(shares)
      .set({ isActive: false })
      .where(eq(shares.token, token));
  }
}

export const storage = new DatabaseStorage();
