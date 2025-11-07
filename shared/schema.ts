import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  score: integer("score").notNull(),
  wallet: text("wallet"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).pick({
  username: true,
  score: true,
  wallet: true,
});

export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboard.$inferSelect;
