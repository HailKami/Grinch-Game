import { users, type User, type InsertUser, leaderboard, type Leaderboard, type InsertLeaderboard } from "@shared/schema";
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
  clearLeaderboard(): Promise<void>;
}

export class DbStorage implements IStorage {
  private async getDb() {
    const { db } = await import("./db");
    return db;
  }

  async getUser(id: number): Promise<User | undefined> {
    const db = await this.getDb();
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.getDb();
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await this.getDb();
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async saveScore(entry: InsertLeaderboard): Promise<Leaderboard> {
    const db = await this.getDb();
    const result = await db.insert(leaderboard).values(entry).returning();
    return result[0];
  }

  async getTopScores(limit: number = 10): Promise<Leaderboard[]> {
    const db = await this.getDb();
    const allScores = await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.score));
    
    // Group by username and keep only the highest score for each
    const uniqueScores = new Map<string, Leaderboard>();
    for (const entry of allScores) {
      const username = entry.username.toLowerCase();
      const existing = uniqueScores.get(username);
      if (!existing || entry.score > existing.score) {
        uniqueScores.set(username, entry);
      }
    }
    
    // Convert map to array, sort by score, and limit
    return Array.from(uniqueScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async clearLeaderboard(): Promise<void> {
    const db = await this.getDb();
    await db.delete(leaderboard);
  }
}

class MemoryStorage implements IStorage {
  private users: User[] = [];
  private leaderboard: Leaderboard[] = [];
  private nextUserId = 1;
  private nextScoreId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser: User = { id: this.nextUserId++, ...insertUser } as User;
    this.users.push(newUser);
    return newUser;
  }

  async saveScore(entry: InsertLeaderboard): Promise<Leaderboard> {
    const newEntry: Leaderboard = { id: this.nextScoreId++, createdAt: new Date(), ...entry } as unknown as Leaderboard;
    this.leaderboard.push(newEntry);
    return newEntry;
  }

  async getTopScores(limit: number = 10): Promise<Leaderboard[]> {
    // Group by username and keep only the highest score for each
    const uniqueScores = new Map<string, Leaderboard>();
    for (const entry of this.leaderboard) {
      const username = entry.username.toLowerCase();
      const existing = uniqueScores.get(username);
      if (!existing || entry.score > existing.score) {
        uniqueScores.set(username, entry);
      }
    }
    
    // Convert map to array, sort by score, and limit
    return Array.from(uniqueScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async clearLeaderboard(): Promise<void> {
    this.leaderboard = [];
    this.nextScoreId = 1;
  }
}

import { PersistentFileStorage } from "./persistentStorage";

// Use persistent file storage by default (forever tracking)
// Falls back to DB if DATABASE_URL is set, or memory if file storage fails
export const storage: IStorage = (() => {
  if (process.env.DATABASE_URL) {
    return new DbStorage();
  }
  try {
    return new PersistentFileStorage();
  } catch (error) {
    console.warn("File storage failed, using memory:", error);
    return new MemoryStorage();
  }
})();
