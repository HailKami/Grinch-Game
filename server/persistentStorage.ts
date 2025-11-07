import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Leaderboard, InsertLeaderboard, User, InsertUser } from "@shared/schema";
import type { IStorage } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LEADERBOARD_FILE = path.join(__dirname, "..", "data", "leaderboard.json");

// Ensure data directory exists
const dataDir = path.dirname(LEADERBOARD_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadLeaderboard(): Leaderboard[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading leaderboard:", error);
  }
  return [];
}

function saveLeaderboard(entries: Leaderboard[]) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving leaderboard:", error);
  }
}

export class PersistentFileStorage implements IStorage {
  private leaderboard: Leaderboard[] = [];
  private nextId = 1;

  constructor() {
    this.leaderboard = loadLeaderboard();
    // Find max ID
    if (this.leaderboard.length > 0) {
      this.nextId = Math.max(...this.leaderboard.map(e => e.id)) + 1;
    }
  }

  async saveScore(entry: InsertLeaderboard): Promise<Leaderboard> {
    const newEntry: Leaderboard = {
      id: this.nextId++,
      createdAt: new Date(),
      ...entry,
    } as unknown as Leaderboard;
    
    this.leaderboard.push(newEntry);
    saveLeaderboard(this.leaderboard);
    return newEntry;
  }

  async getTopScores(limit: number = 10): Promise<Leaderboard[]> {
    return this.leaderboard
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getAllScores(): Promise<Leaderboard[]> {
    return this.leaderboard.slice().sort((a, b) => b.score - a.score);
  }

  // User methods (not used but required by interface)
  async getUser(id: number): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("User creation not supported in file storage");
  }
}

