import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompletedTaskSchema } from "@shared/schema";

// Helper function to get current week start date (Monday)
function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay() || 7; // Get current day (1=Monday, 7=Sunday)
  d.setDate(d.getDate() - day + 1); // Set to Monday
  return d.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get completed tasks (optionally filtered by week)
  app.get("/api/completed-tasks", async (req, res) => {
    try {
      const weekStartDate = req.query.week as string | undefined;
      const currentWeek = weekStartDate || getWeekStartDate(new Date());
      const tasks = await storage.getCompletedTasks(currentWeek);
      res.json(tasks);
    } catch (error) {
      console.error(`Error fetching completed tasks: ${error}`);
      res.status(500).json({ error: "Failed to fetch completed tasks" });
    }
  });

  // Create a new completed task with compounding logic
  app.post("/api/completed-tasks", async (req, res) => {
    try {
      const { taskId, name, points: basePoints, note } = req.body;
      const now = new Date();
      const weekStartDate = getWeekStartDate(now);

      // Get or create task stats for this week
      let taskStat = await storage.getTaskStatByTaskId(taskId, weekStartDate);
      
      if (!taskStat) {
        // First time doing this task this week
        taskStat = await storage.createTaskStats({
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
        
        taskStat = await storage.updateTaskStats(taskId, weekStartDate, {
          currentValue: newCurrentValue,
          timesThisWeek: newTimesThisWeek,
          lastCompleted: now
        });
      }

      // Create completed task with current value
      const task = await storage.createCompletedTask({
        taskId,
        name,
        points: taskStat.currentValue,
        note,
        weekStartDate
      });

      // Update weekly history
      const weekTasks = await storage.getCompletedTasks(weekStartDate);
      const totalPoints = weekTasks.reduce((sum, t) => sum + t.points, 0);
      await storage.createOrUpdateWeeklyHistory({
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
      const weekStartDate = getWeekStartDate(new Date());
      await storage.clearAllCompletedTasks(weekStartDate);
      
      // Reset all task stats for the week
      const taskStatsToReset = await storage.getTaskStats(weekStartDate);
      for (const stat of taskStatsToReset) {
        await storage.updateTaskStats(stat.taskId, weekStartDate, {
          currentValue: stat.basePoints,
          timesThisWeek: 0,
          lastCompleted: null
        });
      }
      
      // Update weekly history
      await storage.createOrUpdateWeeklyHistory({
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
  app.get("/api/task-stats", async (req, res) => {
    try {
      const weekStartDate = req.query.week as string || getWeekStartDate(new Date());
      const stats = await storage.getTaskStats(weekStartDate);
      res.json(stats);
    } catch (error) {
      console.error(`Error fetching task stats: ${error}`);
      res.status(500).json({ error: "Failed to fetch task stats" });
    }
  });

  // Get weekly history
  app.get("/api/weekly-history", async (req, res) => {
    try {
      const history = await storage.getWeeklyHistory();
      res.json(history);
    } catch (error) {
      console.error(`Error fetching weekly history: ${error}`);
      res.status(500).json({ error: "Failed to fetch weekly history" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
