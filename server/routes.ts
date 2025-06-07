import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompletedTaskSchema } from "@shared/schema";

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

  // Create a new completed task
  app.post("/api/completed-tasks", async (req, res) => {
    try {
      const result = insertCompletedTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid task data", details: result.error.issues });
      }

      const task = await storage.createCompletedTask(result.data);
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

  // Clear all completed tasks
  app.delete("/api/completed-tasks", async (req, res) => {
    try {
      await storage.clearAllCompletedTasks();
      res.status(204).send();
    } catch (error) {
      console.error(`Error clearing completed tasks: ${error}`);
      res.status(500).json({ error: "Failed to clear completed tasks" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
