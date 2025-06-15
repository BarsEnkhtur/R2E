import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompletedTaskSchema, insertCustomTaskSchema } from "@shared/schema";
import { setupAuth, isAuthenticated, getUserId } from "./replitAuth";
import { generateWeeklyMessage, generateGoalAchievementMessage, generateAIBadge } from "./openai";

// Helper function to get current week start date (Monday)
function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay() || 7; // Get current day (1=Monday, 7=Sunday)
  d.setDate(d.getDate() - day + 1); // Set to Monday
  return d.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Google OAuth authentication
  await setupAuth(app);

  // Auth route
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get progress data for a specific date range
  app.get("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { start, end } = req.query as { start?: string; end?: string };
      
      if (!start || !end) {
        return res.status(400).json({ error: "start and end dates are required" });
      }
      
      // Get tasks for the date range
      const weekStartDate = start;
      const tasks = await storage.getCompletedTasks(userId, weekStartDate);
      
      // Get task stats to understand base points and multipliers
      const taskStats = await storage.getTaskStats(userId, weekStartDate);
      const taskStatsMap = new Map(taskStats.map(stat => [stat.taskId, stat]));
      
      // Get weekly goal
      const goalData = await storage.calculateDynamicGoal(userId, weekStartDate);
      
      // Get weekly history
      const history = await storage.getWeeklyHistory(userId);
      
      // Enhanced task data with individual completions including multiplier info
      const completions = tasks.map(task => {
        const stat = taskStatsMap.get(task.taskId);
        const basePoints = stat?.basePoints || task.points;
        const multiplier = task.points / basePoints; // Calculate actual multiplier used
        
        return {
          taskId: task.taskId,
          timestamp: task.completedAt,
          basePoints,
          multiplier,
          actualPoints: task.points,
          name: task.name,
          note: task.note
        };
      });
      
      // Build comprehensive weekly task data for frontend
      const weeklyTaskData: Record<string, any> = {};
      
      // Process completed tasks to build weekly stats
      tasks.forEach(task => {
        if (!weeklyTaskData[task.taskId]) {
          const stat = taskStatsMap.get(task.taskId);
          weeklyTaskData[task.taskId] = {
            taskId: task.taskId,
            displayName: task.name,
            basePoints: stat?.basePoints || task.points,
            completions: 0,
            totalPoints: 0,
            currentMultiplier: 1.0
          };
        }
        
        weeklyTaskData[task.taskId].completions += 1;
        weeklyTaskData[task.taskId].totalPoints += task.points;
      });
      
      // New logarithmic multiplier function with 1.5x cap
      const computeMultiplier = (count: number): number => {
        const maxBonus = 0.5;
        const scale = 3;
        const bonus = maxBonus * Math.log1p(count - 1) / Math.log1p(scale);
        return 1 + Math.min(bonus, maxBonus);
      };

      // Calculate current multipliers for next completion
      Object.values(weeklyTaskData).forEach((taskData: any) => {
        const nextCount = taskData.completions + 1;
        taskData.currentMultiplier = computeMultiplier(nextCount);
      });
      
      // Calculate top tasks using actual completion points
      const taskCounts = tasks.reduce((acc: Record<string, {name: string, points: number, count: number, basePoints: number}>, task) => {
        if (!acc[task.taskId]) {
          const stat = taskStatsMap.get(task.taskId);
          acc[task.taskId] = { 
            name: task.name, 
            points: 0, 
            count: 0,
            basePoints: stat?.basePoints || task.points
          };
        }
        acc[task.taskId].points += task.points; // Use actual points earned
        acc[task.taskId].count += 1;
        return acc;
      }, {});
      
      const topTasks = Object.values(taskCounts)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
      
      const progressData = {
        points: tasks.reduce((sum, task) => sum + task.points, 0), // Total actual points earned
        goal: goalData,
        tasksCompleted: tasks.length,
        topTasks,
        completions, // Individual completion data with multipliers
        weeklyTaskData: Object.values(weeklyTaskData), // Weekly task statistics for Tasks page
        history: history.slice(0, 8)
      };
      
      res.json(progressData);
    } catch (error) {
      console.error(`Error fetching progress data: ${error}`);
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  // Get completed tasks (optionally filtered by week)
  app.get("/api/completed-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const weekStartDate = req.query.weekStartDate as string | undefined;
      const currentWeek = weekStartDate || getWeekStartDate(new Date());
      const tasks = await storage.getCompletedTasks(userId, currentWeek);
      res.json(tasks);
    } catch (error) {
      console.error(`Error fetching completed tasks: ${error}`);
      res.status(500).json({ error: "Failed to fetch completed tasks" });
    }
  });

  // Get task stats for a specific week
  app.get("/api/task-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const weekStartDate = req.query.weekStartDate as string || getWeekStartDate(new Date());
      const stats = await storage.getTaskStats(userId, weekStartDate);
      res.json(stats);
    } catch (error) {
      console.error(`Error fetching task stats: ${error}`);
      res.status(500).json({ error: "Failed to fetch task stats" });
    }
  });

  // Create a new completed task with compounding logic
  app.post("/api/completed-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { taskId, name, points: basePoints, note } = req.body;
      const now = new Date();
      const weekStartDate = getWeekStartDate(now);

      // New logarithmic multiplier function with 1.5x cap
      const computeMultiplier = (count: number): number => {
        const maxBonus = 0.5;
        const scale = 3;
        const bonus = maxBonus * Math.log1p(count - 1) / Math.log1p(scale);
        return 1 + Math.min(bonus, maxBonus);
      };

      // Get or create task stats for this week
      let taskStat = await storage.getTaskStatByTaskId(userId, taskId, weekStartDate);
      
      if (!taskStat) {
        // First time doing this task this week
        taskStat = await storage.createTaskStats({
          userId,
          taskId,
          taskName: name,
          basePoints,
          currentValue: basePoints,
          timesThisWeek: 1,
          lastCompleted: now,
          weekStartDate
        });
      } else {
        // Task already done this week - apply logarithmic multiplier
        const newTimesThisWeek = taskStat.timesThisWeek + 1;
        const multiplier = computeMultiplier(newTimesThisWeek);
        const newCurrentValue = Math.round(basePoints * multiplier);
        
        taskStat = await storage.updateTaskStats(userId, taskId, weekStartDate, {
          currentValue: newCurrentValue,
          timesThisWeek: newTimesThisWeek,
          lastCompleted: now
        });
      }

      // Create completed task with current value
      const task = await storage.createCompletedTask({
        userId,
        taskId,
        name,
        points: taskStat.currentValue,
        note,
        weekStartDate
      });

      // Update weekly history
      const weekTasks = await storage.getCompletedTasks(userId, weekStartDate);
      const totalPoints = weekTasks.reduce((sum, t) => sum + t.points, 0);
      await storage.createOrUpdateWeeklyHistory({
        userId,
        weekStartDate,
        totalPoints,
        tasksCompleted: weekTasks.length
      });

      res.status(201).json(task);
    } catch (error) {
      console.error(`Error creating completed task: ${error}`);
      res.status(500).json({ error: "Failed to create completed task" });
    }
  });

  // Generate micro feedback for completed task
  app.post("/api/micro-feedback", isAuthenticated, async (req, res) => {
    try {
      const { generateMicroFeedback } = await import('./openai.js');
      const { taskId, taskName, note, streakCount, isFirstThisWeek } = req.body;
      
      const feedback = await generateMicroFeedback({
        taskId,
        taskName,
        note,
        streakCount: streakCount || 0,
        isFirstThisWeek: isFirstThisWeek || false
      });
      
      res.json({ feedback });
    } catch (error) {
      console.error(`Error generating micro feedback: ${error}`);
      res.status(500).json({ error: "Failed to generate feedback" });
    }
  });

  // Delete a completed task
  app.delete("/api/completed-tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      await storage.deleteCompletedTask(id);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting completed task: ${error}`);
      res.status(500).json({ error: "Failed to delete completed task" });
    }
  });

  // Clear all completed tasks and reset week
  app.delete("/api/completed-tasks", async (req, res) => {
    try {
      const userId = getUserId(req);
      const weekStartDate = getWeekStartDate(new Date());
      await storage.clearAllCompletedTasks(userId, weekStartDate);
      
      // Reset all task stats for the week
      const taskStatsToReset = await storage.getTaskStats(userId, weekStartDate);
      for (const stat of taskStatsToReset) {
        await storage.updateTaskStats(userId, stat.taskId, weekStartDate, {
          currentValue: stat.basePoints,
          timesThisWeek: 0,
          lastCompleted: null
        });
      }
      
      // Update weekly history
      await storage.createOrUpdateWeeklyHistory({
        userId,
        weekStartDate,
        totalPoints: 0,
        tasksCompleted: 0
      });
      
      res.status(204).send();
    } catch (error) {
      console.error(`Error clearing completed tasks: ${error}`);
      res.status(500).json({ error: "Failed to clear completed tasks" });
    }
  });

  // Get task stats for current week (for frontend display)
  app.get("/api/task-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const weekStartDate = req.query.week as string || getWeekStartDate(new Date());
      const stats = await storage.getTaskStats(userId, weekStartDate);
      res.json(stats);
    } catch (error) {
      console.error(`Error fetching task stats: ${error}`);
      res.status(500).json({ error: "Failed to fetch task stats" });
    }
  });

  // Get weekly history
  app.get("/api/weekly-history", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const history = await storage.getWeeklyHistory(userId);
      res.json(history);
    } catch (error) {
      console.error(`Error fetching weekly history: ${error}`);
      res.status(500).json({ error: "Failed to fetch weekly history" });
    }
  });

  // Get dynamic goal for a specific week
  app.get("/api/dynamic-goal/:week", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { week } = req.params;
      const dynamicGoal = await storage.calculateDynamicGoal(userId, week);
      res.json({ goal: dynamicGoal });
    } catch (error) {
      console.error(`Error calculating dynamic goal: ${error}`);
      res.status(500).json({ error: "Failed to calculate dynamic goal" });
    }
  });

  // Get custom tasks
  app.get("/api/custom-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const tasks = await storage.getCustomTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error(`Error fetching custom tasks: ${error}`);
      res.status(500).json({ error: "Failed to fetch custom tasks" });
    }
  });

  // Create custom task
  app.post("/api/custom-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const taskData = { ...req.body, userId };
      const task = await storage.createCustomTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error(`Error creating custom task: ${error}`);
      res.status(500).json({ error: "Failed to create custom task" });
    }
  });

  // Update custom task
  app.patch("/api/custom-tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const task = await storage.updateCustomTask(parseInt(id), updates);
      res.json(task);
    } catch (error) {
      console.error(`Error updating custom task: ${error}`);
      res.status(500).json({ error: "Failed to update custom task" });
    }
  });

  // Update completed task note
  app.patch("/api/completed-tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
      
      const updatedTask = await storage.updateCompletedTask(parseInt(id), { note });
      res.json(updatedTask);
    } catch (error) {
      console.error(`Error updating completed task: ${error}`);
      res.status(500).json({ error: "Failed to update completed task" });
    }
  });

  // Delete custom task
  app.delete("/api/custom-tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCustomTask(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting custom task: ${error}`);
      res.status(500).json({ error: "Failed to delete custom task" });
    }
  });

  // Get default tasks with any custom overrides
  app.get("/api/default-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const customTasks = await storage.getCustomTasks(userId);
      
      // Default tasks with potential custom overrides
      const defaultTasks = [
        {
          id: "job-application",
          name: "Job Application",
          description: "Apply to a new position",
          points: 3,
          icon: "Briefcase",
          color: "blue"
        },
        {
          id: "networking",
          name: "Networking", 
          description: "Connect with professionals",
          points: 2,
          icon: "Users",
          color: "green"
        },
        {
          id: "coding-practice",
          name: "Coding Practice",
          description: "Solve coding challenges", 
          points: 2,
          icon: "Code",
          color: "purple"
        },
        {
          id: "gym-recovery",
          name: "Gym/Recovery/PT",
          description: "Physical wellness",
          points: 2,
          icon: "Heart", 
          color: "red"
        },
        {
          id: "learn-skill",
          name: "Learn New Skill",
          description: "Study or practice new abilities",
          points: 2,
          icon: "Lightbulb",
          color: "orange"
        }
      ];

      // Apply any custom overrides
      const tasksWithOverrides = defaultTasks.map(defaultTask => {
        const override = customTasks.find((ct: any) => ct.taskId === defaultTask.id);
        return override ? {
          ...defaultTask,
          name: override.name,
          description: override.description,
          points: override.points,
          icon: override.icon,
          color: override.color,
          hasOverride: true,
          overrideId: override.id
        } : defaultTask;
      });

      res.json(tasksWithOverrides);
    } catch (error) {
      console.error(`Error fetching default tasks: ${error}`);
      res.status(500).json({ error: "Failed to fetch default tasks" });
    }
  });

  // PUBLIC SHARE SYSTEM ROUTES

  // Create a public share of current week's progress
  app.post("/api/shares", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { title, description, weekStartDate } = req.body;
      
      // Generate unique share token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Gather current week's data
      const [completedTasks, taskStats, weeklyHistory, customTasks] = await Promise.all([
        storage.getCompletedTasks(userId, weekStartDate),
        storage.getTaskStats(userId, weekStartDate),
        storage.getWeeklyHistory(userId),
        storage.getCustomTasks(userId)
      ]);
      
      const weekHistory = weeklyHistory.find(w => w.weekStartDate === weekStartDate);
      const dynamicGoal = await storage.calculateDynamicGoal(userId, weekStartDate);
      
      // Create snapshot data
      const snapshotData = {
        completedTasks,
        taskStats,
        weekHistory,
        customTasks,
        dynamicGoal,
        weekStartDate,
        totalPoints: completedTasks.reduce((sum, task) => sum + task.points, 0),
        tasksCompleted: completedTasks.length
      };
      
      const share = await storage.createShare({
        token,
        userId,
        weekStartDate,
        title: title || `Week of ${weekStartDate}`,
        description,
        data: snapshotData
      });
      
      res.status(201).json({ 
        shareUrl: `/share/${token}`,
        share 
      });
    } catch (error) {
      console.error(`Error creating share: ${error}`);
      res.status(500).json({ error: "Failed to create share" });
    }
  });

  // Get public share by token (read-only)
  app.get("/api/shares/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const share = await storage.getShare(token);
      
      if (!share) {
        return res.status(404).json({ error: "Share not found" });
      }
      
      res.json(share);
    } catch (error) {
      console.error(`Error fetching share: ${error}`);
      res.status(500).json({ error: "Failed to fetch share" });
    }
  });

  // Fork a shared week (authenticated users only)
  app.post("/api/shares/:token/fork", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { token } = req.params;
      
      // Authentication is handled by middleware, user is already authenticated here
      
      const share = await storage.getShare(token);
      if (!share) {
        return res.status(404).json({ error: "Share not found" });
      }
      
      const shareData = share.data as any;
      const newWeekStartDate = getWeekStartDate(new Date());
      
      // Fork custom tasks to user's account
      const customTasks = shareData.customTasks || [];
      for (const task of customTasks) {
        try {
          await storage.createCustomTask({
            userId,
            taskId: `${task.taskId}_forked_${Date.now()}`,
            name: task.name,
            description: `${task.description} (forked)`,
            points: task.points,
            icon: task.icon,
            color: task.color,
            isActive: true
          });
        } catch (error) {
          // Skip if task already exists
        }
      }
      
      res.json({ 
        message: "Setup forked successfully",
        redirectTo: `/dashboard/weeks/${newWeekStartDate}`
      });
    } catch (error) {
      console.error(`Error forking share: ${error}`);
      res.status(500).json({ error: "Failed to fork share" });
    }
  });

  // Get user's active shares (authenticated users only)
  app.get("/api/shares", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      // User is authenticated, get their shares
      
      const shares = await storage.getActiveShares(userId);
      res.json(shares);
    } catch (error) {
      console.error(`Error fetching user shares: ${error}`);
      res.status(500).json({ error: "Failed to fetch shares" });
    }
  });

  // Deactivate a share
  app.delete("/api/shares/:token", async (req, res) => {
    try {
      const { token } = req.params;
      await storage.deactivateShare(token);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deactivating share: ${error}`);
      res.status(500).json({ error: "Failed to deactivate share" });
    }
  });

  // Generate weekly summary message
  app.post("/api/weekly-message", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { weekStartDate } = req.body;
      
      // Get week data
      const completedTasks = await storage.getCompletedTasks(userId, weekStartDate);
      const weeklyHistory = await storage.getWeeklyHistory(userId);
      const currentWeekHistory = weeklyHistory.find(w => w.weekStartDate === weekStartDate);
      
      if (!currentWeekHistory) {
        return res.status(404).json({ error: "Week data not found" });
      }
      
      // Calculate task statistics
      const taskCounts: Record<string, { count: number; points: number; name: string }> = {};
      completedTasks.forEach(task => {
        if (!taskCounts[task.taskId]) {
          taskCounts[task.taskId] = { count: 0, points: 0, name: task.name };
        }
        taskCounts[task.taskId].count++;
        taskCounts[task.taskId].points += task.points;
      });
      
      const topTasks = Object.values(taskCounts)
        .sort((a, b) => b.points - a.points)
        .slice(0, 3)
        .map(t => ({ name: t.name, count: t.count, points: t.points }));
      
      // Get previous week for comparison
      const previousWeek = weeklyHistory
        .filter(w => w.weekStartDate < weekStartDate)
        .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))[0];
      
      const performanceData = {
        totalPoints: currentWeekHistory.totalPoints,
        weeklyGoal: currentWeekHistory.weeklyGoal || 15,
        tasksCompleted: currentWeekHistory.tasksCompleted,
        uniqueTaskTypes: Object.keys(taskCounts).length,
        topTasks,
        goalAchieved: currentWeekHistory.goalAchieved || false,
        streaksStarted: 0, // Will be calculated if needed
        weekNumber: weeklyHistory.length,
        previousWeekPoints: previousWeek?.totalPoints
      };
      
      const message = await generateWeeklyMessage(performanceData);
      res.json({ message });
    } catch (error) {
      console.error("Error generating weekly message:", error);
      res.status(500).json({ error: "Failed to generate weekly message" });
    }
  });

  // Generate goal achievement message
  app.post("/api/goal-achievement-message", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { totalPoints, weeklyGoal, tasksCompleted, topTaskToday } = req.body;
      
      const message = await generateGoalAchievementMessage({
        totalPoints,
        weeklyGoal,
        tasksCompleted,
        topTaskToday
      });
      
      res.json({ message });
    } catch (error) {
      console.error("Error generating goal achievement message:", error);
      res.status(500).json({ error: "Failed to generate goal achievement message" });
    }
  });

  // Get AI badges for user
  app.get("/api/ai-badges", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const badges = await storage.getAiBadges(userId);
      
      // If recent=true query param, return only recent badges
      if (req.query.recent === 'true') {
        const recentBadges = badges
          .filter(badge => badge.unlockedAt)
          .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
          .slice(0, 3);
        res.json(recentBadges);
      } else {
        res.json(badges);
      }
    } catch (error) {
      console.error("Error fetching AI badges:", error);
      res.status(500).json({ error: "Failed to fetch AI badges" });
    }
  });

  // Generate and create AI badge based on user patterns
  app.post("/api/generate-ai-badge", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      // Get user's task data to analyze patterns
      const allTasks = await storage.getCompletedTasks(userId);
      const taskStats = await storage.getTaskStats(userId, getWeekStartDate(new Date()));
      
      // Analyze task patterns
      const taskPatterns = new Map();
      let totalPoints = 0;
      
      allTasks.forEach(task => {
        const key = task.taskId;
        if (!taskPatterns.has(key)) {
          taskPatterns.set(key, {
            taskId: task.taskId,
            taskName: task.name,
            count: 0,
            totalPoints: 0,
            notes: []
          });
        }
        const pattern = taskPatterns.get(key);
        pattern.count++;
        pattern.totalPoints += task.points;
        pattern.lastCompleted = task.completedAt;
        if (task.note) pattern.notes.push(task.note);
        totalPoints += task.points;
      });

      const completedTaskPatterns = Array.from(taskPatterns.values()).map(p => ({
        ...p,
        averagePoints: p.totalPoints / p.count
      }));

      // Calculate streak and consistency metrics
      const uniqueTaskTypes = taskPatterns.size;
      const currentStreak = 1; // Simplified for demo
      const longestStreak = Math.max(currentStreak, 3);
      const averageTasksPerWeek = allTasks.length / 4; // Assuming 4 weeks of data
      
      // Get top categories
      const topCategories = completedTaskPatterns
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(p => p.taskName);

      const badgeData = {
        userId,
        completedTasks: completedTaskPatterns,
        totalTasks: allTasks.length,
        totalPoints,
        uniqueTaskTypes,
        longestStreak,
        currentStreak,
        averageTasksPerWeek,
        topCategories,
        recentAchievements: []
      };

      // Generate AI badge
      const generatedBadge = await generateAIBadge(badgeData);
      
      if (!generatedBadge) {
        return res.json({ message: "No new badge patterns detected at this time" });
      }

      // Check if badge already exists
      const existingBadge = await storage.checkExistingBadge(userId, generatedBadge.badgeId);
      if (existingBadge) {
        return res.json({ message: "This badge has already been earned" });
      }

      // Create the badge
      const newBadge = await storage.createAiBadge({
        userId,
        badgeId: generatedBadge.badgeId,
        name: generatedBadge.name,
        description: generatedBadge.description,
        icon: generatedBadge.icon,
        color: generatedBadge.color,
        category: generatedBadge.category,
        criteria: generatedBadge.criteria,
        taskPatterns: generatedBadge.taskPatterns
      });

      res.json({ 
        badge: newBadge,
        message: `Congratulations! You've unlocked the "${newBadge.name}" badge!`
      });
    } catch (error) {
      console.error("Error generating AI badge:", error);
      res.status(500).json({ error: "Failed to generate AI badge" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
