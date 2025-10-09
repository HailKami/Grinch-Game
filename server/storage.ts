import { users, type User, type InsertUser, leaderboard, type Leaderboard, type InsertLeaderboard } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Leaderboard methods
  saveScore(entry: InsertLeaderboard): Promise<Leaderboard>;
  getTopScores(limit: number): Promise<Leaderboard[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async saveScore(entry: InsertLeaderboard): Promise<Leaderboard> {
    const result = await db.insert(leaderboard).values(entry).returning();
    return result[0];
  }

  async getTopScores(limit: number = 10): Promise<Leaderboard[]> {
    return await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.score))
      .limit(limit);
  }
}

export const storage = new DbStorage();
