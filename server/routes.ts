import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Save a score to the leaderboard
  app.post("/api/leaderboard", async (req, res) => {
    try {
      const validatedData = insertLeaderboardSchema.parse(req.body);
      const entry = await storage.saveScore(validatedData);
      res.json(entry);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: "Invalid request data" });
      } else {
        res.status(500).json({ error: "Failed to save score" });
      }
    }
  });

  // Get top scores from the leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      let limit = parseInt(req.query.limit as string) || 10;
      // Ensure limit is a positive integer between 1 and 100
      limit = Math.max(1, Math.min(100, limit));
      const topScores = await storage.getTopScores(limit);
      res.json(topScores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
