import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompletedTaskSchema, insertCustomTaskSchema } from "@shared/schema";
import { setupAuth, isAuthenticated, getUserId } from "./replitAuth";

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

  // Get completed tasks (optionally filtered by week)
  app.get("/api/completed-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const weekStartDate = req.query.week as string | undefined;
      const currentWeek = weekStartDate || getWeekStartDate(new Date());
      const tasks = await storage.getCompletedTasks(userId, currentWeek);
      res.json(tasks);
    } catch (error) {
      console.error(`Error fetching completed tasks: ${error}`);
      res.status(500).json({ error: "Failed to fetch completed tasks" });
    }
  });

  // Create a new completed task with compounding logic
  app.post("/api/completed-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { taskId, name, points: basePoints, note } = req.body;
      const now = new Date();
      const weekStartDate = getWeekStartDate(now);

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
        // Task already done this week - apply compounding
        const newTimesThisWeek = taskStat.timesThisWeek + 1;
        const compoundingBonus = Math.min((newTimesThisWeek - 1) * 0.5, basePoints); // Cap at 2x base
        const newCurrentValue = Math.min(basePoints + compoundingBonus, basePoints * 2);
        
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

  // Delete a completed task
  app.delete("/api/completed-tasks/:id", async (req, res) => {
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
  app.post("/api/custom-tasks", async (req, res) => {
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
  app.patch("/api/custom-tasks/:id", async (req, res) => {
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
  app.patch("/api/completed-tasks/:id", async (req, res) => {
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
  app.delete("/api/custom-tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCustomTask(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting custom task: ${error}`);
      res.status(500).json({ error: "Failed to delete custom task" });
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
      
      // For demo, return unauthorized - in production this would check authentication
      if (userId === DEMO_USER_ID) {
        return res.status(401).json({ 
          error: "Authentication required", 
          message: "Sign in to fork this setup to your own account" 
        });
      }
      
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
  app.get("/api/shares", async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (userId === DEMO_USER_ID) {
        return res.json([]); // Demo users have no shares
      }
      
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

  const httpServer = createServer(app);

  return httpServer;
}
