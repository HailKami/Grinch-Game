import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint to verify routes are working
  app.get("/api/test", (req, res) => {
    res.json({ message: "API routes are working", timestamp: new Date().toISOString() });
  });

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

  // Get top scores from the leaderboard (public - no wallet addresses)
  app.get("/api/leaderboard", async (req, res) => {
    try {
      let limit = parseInt(req.query.limit as string) || 10;
      // Ensure limit is a positive integer between 1 and 100
      limit = Math.max(1, Math.min(100, limit));
      const topScores = await storage.getTopScores(limit);
      // Remove wallet addresses from public response
      const publicScores = topScores.map(({ wallet, ...rest }) => rest);
      res.json(publicScores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Admin endpoint to get leaderboard with wallet addresses
  app.get("/api/admin/leaderboard", async (req, res) => {
    try {
      const adminPassword = process.env.ADMIN_PASSWORD || "Hailkami628";
      const providedPassword = (req.query.password as string)?.trim();
      
      if (!providedPassword || providedPassword !== adminPassword.trim()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let limit = parseInt(req.query.limit as string) || 100;
      limit = Math.max(1, Math.min(1000, limit));
      const topScores = await storage.getTopScores(limit);
      res.json(topScores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Admin search by username
  app.get("/api/admin/search", async (req, res) => {
    try {
      const adminPassword = process.env.ADMIN_PASSWORD || "Hailkami628";
      const providedPassword = (req.query.password as string)?.trim();
      
      if (!providedPassword || providedPassword !== adminPassword.trim()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const username = req.query.username as string;
      if (!username) {
        return res.status(400).json({ error: "Username required" });
      }

      const allScores = await storage.getTopScores(1000);
      const matches = allScores.filter((entry: any) => 
        entry.username?.toLowerCase().includes(username.toLowerCase())
      );
      
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: "Failed to search" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
