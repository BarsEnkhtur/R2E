import { users, completedTasks, taskStats, weeklyHistory, customTasks, shares, aiBadges, type User, type UpsertUser, type CompletedTask, type InsertCompletedTask, type TaskStats, type InsertTaskStats, type WeeklyHistory, type InsertWeeklyHistory, type CustomTask, type InsertCustomTask, type Share, type InsertShare, type AiBadge, type InsertAiBadge } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  exportUserData(userId: string): Promise<any>;
  
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
  
  // AI Badge operations
  getAiBadges(userId: string): Promise<AiBadge[]>;
  createAiBadge(badge: InsertAiBadge): Promise<AiBadge>;
  checkExistingBadge(userId: string, badgeId: string): Promise<boolean>;
  
  // Demo data operations
  initializeDemoData(userId: string): Promise<void>;
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

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async exportUserData(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    const completedTasks = await this.getCompletedTasks(userId);
    const customTasks = await this.getCustomTasks(userId);
    const weeklyHistory = await this.getWeeklyHistory(userId);
    const aiBadges = await this.getAiBadges(userId);
    
    return {
      user: {
        id: user?.id,
        email: user?.email,
        displayName: user?.displayName,
        createdAt: user?.createdAt,
      },
      completedTasks,
      customTasks,
      weeklyHistory,
      badges: aiBadges,
      exportedAt: new Date().toISOString(),
    };
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

  async initializeDemoData(userId: string): Promise<void> {
    // Clear existing demo data first
    await this.clearAllCompletedTasks(userId);
    await db.delete(taskStats).where(eq(taskStats.userId, userId));
    await db.delete(weeklyHistory).where(eq(weeklyHistory.userId, userId));
    await db.delete(customTasks).where(eq(customTasks.userId, userId));

    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    const weekStartDate = currentWeekStart.toISOString().split('T')[0];

    // Create realistic completed tasks for this week
    const completedTasksData = [
      {
        userId,
        taskId: "job-application",
        name: "Job Application",
        points: 3,
        note: "Applied to Senior Developer position at TechCorp",
        completedAt: new Date(currentWeekStart.getTime() + 1 * 24 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "networking",
        name: "Professional Networking",
        points: 2,
        note: "Connected with 3 engineers on LinkedIn",
        completedAt: new Date(currentWeekStart.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "code-push",
        name: "Code Push",
        points: 3,
        note: "Completed authentication system for portfolio project",
        completedAt: new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "skill-practice",
        name: "Skill Practice",
        points: 2,
        note: "Completed React Testing Library tutorial",
        completedAt: new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "interview-prep",
        name: "Interview Prep",
        points: 2,
        note: "Practiced system design questions",
        completedAt: new Date(currentWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "job-application",
        name: "Job Application",
        points: 3,
        note: "Applied to Frontend Engineer role at StartupXYZ",
        completedAt: new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000),
        weekStartDate
      }
    ];

    await db.insert(completedTasks).values(completedTasksData);

    // Create task stats showing progression
    const taskStatsData = [
      {
        userId,
        taskId: "job-application",
        taskName: "Job Application",
        basePoints: 3,
        currentValue: 3.5,
        timesThisWeek: 2,
        lastCompleted: new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "networking",
        taskName: "Professional Networking",
        basePoints: 2,
        currentValue: 2.2,
        timesThisWeek: 1,
        lastCompleted: new Date(currentWeekStart.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "code-push",
        taskName: "Code Push",
        basePoints: 3,
        currentValue: 3.2,
        timesThisWeek: 1,
        lastCompleted: new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "skill-practice",
        taskName: "Skill Practice",
        basePoints: 2,
        currentValue: 2.1,
        timesThisWeek: 1,
        lastCompleted: new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        weekStartDate
      },
      {
        userId,
        taskId: "interview-prep",
        taskName: "Interview Prep",
        basePoints: 2,
        currentValue: 2.1,
        timesThisWeek: 1,
        lastCompleted: new Date(currentWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
        weekStartDate
      }
    ];

    await db.insert(taskStats).values(taskStatsData);

    // Create weekly history showing past progress
    const weeklyHistoryData = [
      {
        userId,
        weekStartDate: new Date(currentWeekStart.getTime() - 3 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalPoints: 18,
        tasksCompleted: 8,
        createdAt: new Date(currentWeekStart.getTime() - 3 * 7 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        weekStartDate: new Date(currentWeekStart.getTime() - 2 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalPoints: 22,
        tasksCompleted: 10,
        createdAt: new Date(currentWeekStart.getTime() - 2 * 7 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        weekStartDate: new Date(currentWeekStart.getTime() - 1 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalPoints: 25,
        tasksCompleted: 11,
        createdAt: new Date(currentWeekStart.getTime() - 1 * 7 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        weekStartDate,
        totalPoints: 15.8,
        tasksCompleted: 6,
        createdAt: now
      }
    ];

    await db.insert(weeklyHistory).values(weeklyHistoryData);

    // Create a custom task example with unique ID
    await db.insert(customTasks).values({
      userId,
      taskId: "custom-portfolio-update",
      name: "Portfolio Update",
      description: "Update portfolio website with latest projects",
      points: 2,
      icon: "Globe",
      color: "purple",
      isActive: true,
      createdAt: now
    });
  }

  async getAiBadges(userId: string): Promise<AiBadge[]> {
    return await db.select()
      .from(aiBadges)
      .where(and(eq(aiBadges.userId, userId), eq(aiBadges.isVisible, true)))
      .orderBy(desc(aiBadges.unlockedAt));
  }

  async createAiBadge(badge: InsertAiBadge): Promise<AiBadge> {
    const [newBadge] = await db.insert(aiBadges).values(badge).returning();
    return newBadge;
  }

  async checkExistingBadge(userId: string, badgeId: string): Promise<boolean> {
    const existing = await db.select({ id: aiBadges.id })
      .from(aiBadges)
      .where(and(eq(aiBadges.userId, userId), eq(aiBadges.badgeId, badgeId)))
      .limit(1);
    return existing.length > 0;
  }
}

export const storage = new DatabaseStorage();
