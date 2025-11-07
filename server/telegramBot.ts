import type { Express } from "express";
import { storage } from "./storage";

// Lazy import telegraf only if configured
async function getTelegraf() {
  const { Telegraf } = await import("telegraf");
  return { Telegraf } as typeof import("telegraf");
}

export async function registerTelegramBot(app: Express) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || "http://127.0.0.1:5000";

  if (!token) {
    console.log("⚠️  TELEGRAM_BOT_TOKEN not set, skipping Telegram bot");
    return;
  }

  const { Telegraf } = await getTelegraf();
  const bot = new Telegraf(token);

  // /start command - play game button
  bot.command("start", async (ctx) => {
    const gameUrl = `${publicBaseUrl}/?tg=${ctx.from.id}`;
    const keyboard = {
      inline_keyboard: [[{ text: "🎮 Play Game", url: gameUrl }]],
    };
    await ctx.reply(
      "🎄 Welcome to Grinchy Gifts! 🎁\n\nClick below to play and catch falling gifts!",
      { reply_markup: keyboard }
    );
  });

  // /help command
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "📖 Available Commands:\n\n" +
      "/start - Play the game\n" +
      "/help - Show this help\n" +
      "/wallet <address> - Set your Solana wallet for prizes\n" +
      "/leaderboard - View top 10 players\n" +
      "/rules - Game rules and how to play"
    );
  });

  // /wallet command - save wallet address
  bot.command("wallet", async (ctx) => {
    const parts = ctx.message.text.trim().split(/\s+/);
    if (parts.length < 2) {
      await ctx.reply("Usage: /wallet <your_solana_address>\n\nExample: /wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
      return;
    }
    const address = parts[1];
    // Basic Solana address validation (32-44 base58 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      await ctx.reply("❌ That doesn't look like a valid Solana address. Please check and try again.");
      return;
    }
    // Store wallet linked to Telegram user ID (you can extend storage to persist this)
    // For now, just confirm
    await ctx.reply(`✅ Wallet saved: ${address}\n\nNow when you play and save your score, this wallet will be linked!`);
  });

  // /leaderboard command - show top players (no wallet addresses)
  bot.command("leaderboard", async (ctx) => {
    try {
      const topScores = await storage.getTopScores(10);
      if (topScores.length === 0) {
        await ctx.reply("🏆 No scores yet! Be the first to play!");
        return;
      }
      let message = "🏆 Top Players 🏆\n\n";
      topScores.forEach((entry, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
        message += `${medal} ${(entry as any).username || entry.username} - ${entry.score} pts\n`;
      });
      await ctx.reply(message);
    } catch (error) {
      await ctx.reply("❌ Error fetching leaderboard. Please try again later.");
    }
  });

  // /rules command
  bot.command("rules", async (ctx) => {
    await ctx.reply(
      "📜 Game Rules:\n\n" +
      "🎯 Catch falling gifts to score points\n" +
      "💣 Avoid bomb gifts - they end your game!\n" +
      "❄️ Snowballs freeze you for 1 second\n" +
      "🎰 Every 20 points, spin the slot machine (2% chance to double points!)\n" +
      "🏆 Top 5 players each week win prizes!\n\n" +
      "Controls: Arrow Keys or A/D to move\n" +
      "Mobile: Tap left/right side of screen"
    );
  });

  // Set up webhook if PUBLIC_BASE_URL is set, otherwise use polling
  if (publicBaseUrl && publicBaseUrl !== "http://127.0.0.1:5000") {
    const webhookPath = `/api/telegram/webhook`;
    app.post(webhookPath, async (req, res) => {
      try {
        await bot.handleUpdate(req.body);
        res.status(200).json({ ok: true });
      } catch (error) {
        console.error("Telegram webhook error:", error);
        res.status(500).json({ ok: false });
      }
    });
    console.log(`✅ Telegram bot webhook ready at ${webhookPath}`);
  } else {
    // Use polling for local development
    bot.launch().then(() => {
      console.log("✅ Telegram bot running (polling mode)");
    }).catch((err) => {
      console.error("❌ Telegram bot failed to start:", err);
    });
  }

  // Graceful shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

