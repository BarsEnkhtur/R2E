import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompletedTaskSchema } from "@shared/schema";

// Helper function to get current week of year
function getWeekOfYear(date: Date): { weekOfYear: number; year: number } {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const weekOfYear = Math.ceil((days + start.getDay() + 1) / 7);
  return { weekOfYear, year: date.getFullYear() };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all completed tasks
  app.get("/api/completed-tasks", async (req, res) => {
    try {
      const tasks = await storage.getCompletedTasks();
      res.json(tasks);
    } catch (error) {
      console.error(`Error fetching completed tasks: ${error}`);
      res.status(500).json({ error: "Failed to fetch completed tasks" });
    }
  });

  // Create a new completed task with compounding logic
  app.post("/api/completed-tasks", async (req, res) => {
    try {
      const result = insertCompletedTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid task data", details: result.error.issues });
      }

      const { taskId, name, points: basePoints, note } = result.data;
      const now = new Date();
      const { weekOfYear, year } = getWeekOfYear(now);

      // Get or create task stats for this week
      let taskStat = await storage.getTaskStatByTaskId(taskId, weekOfYear, year);
      
      if (!taskStat) {
        // First time doing this task this week
        taskStat = await storage.createTaskStats({
          taskId,
          taskName: name,
          basePoints,
          currentValue: basePoints,
          timesThisWeek: 1,
          lastCompleted: now,
          weekOfYear,
          year
        });
      } else {
        // Task already done this week - apply compounding
        const newTimesThisWeek = taskStat.timesThisWeek + 1;
        const compoundingBonus = Math.min((newTimesThisWeek - 1) * 0.5, basePoints); // Cap at 2x base
        const newCurrentValue = Math.min(basePoints + compoundingBonus, basePoints * 2);
        
        taskStat = await storage.updateTaskStats(taskId, {
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
        note
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
      await storage.clearAllCompletedTasks();
      // Also clear task stats for current week
      const { weekOfYear, year } = getWeekOfYear(new Date());
      const taskStatsToReset = await storage.getTaskStats(weekOfYear, year);
      
      // Reset all task stats for the week
      for (const stat of taskStatsToReset) {
        await storage.updateTaskStats(stat.taskId, {
          currentValue: stat.basePoints,
          timesThisWeek: 0,
          lastCompleted: null
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(`Error clearing completed tasks: ${error}`);
      res.status(500).json({ error: "Failed to clear completed tasks" });
    }
  });

  // Get task stats for current week (for frontend display)
  app.get("/api/task-stats", async (req, res) => {
    try {
      const { weekOfYear, year } = getWeekOfYear(new Date());
      const stats = await storage.getTaskStats(weekOfYear, year);
      res.json(stats);
    } catch (error) {
      console.error(`Error fetching task stats: ${error}`);
      res.status(500).json({ error: "Failed to fetch task stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
