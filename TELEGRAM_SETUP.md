# Telegram Bot Setup Guide

## ✅ What's Done

1. **Persistent Leaderboard** - Scores saved forever in `data/leaderboard.json`
2. **Weekly Email** - Top 5 players emailed to jojothedeity@gmail.com every 7 days
3. **Telegram Bot** - Integrated into game server with working commands
4. **Play from Telegram** - Users can click "Play Game" button in bot

## 🚀 Setup Steps

### 1. Install Dependencies
```bash
cd "/Users/jordanpetty/Desktop/GrinchyGifts/GrinchyGifts"
npm install
```

### 2. Set Environment Variables

Create a `.env` file or export these before running:

```bash
# Telegram Bot (required for bot to work)
export TELEGRAM_BOT_TOKEN="8503017938:AAFLaYGKGmd_aUiVIRxkhp-4Ec_CLZyjbDw"

# Public URL (for webhook mode, or leave as localhost for polling)
export PUBLIC_BASE_URL="http://127.0.0.1:5000"  # or your deployed URL

# Email (required for weekly emails)
export EMAIL_USER="your-gmail@gmail.com"
export EMAIL_PASSWORD="your-app-password"  # Gmail App Password, not regular password
```

### 3. Gmail App Password Setup

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Use that 16-character password as `EMAIL_PASSWORD`

### 4. Run the Server

```bash
npm run dev
```

The bot will:
- Use **polling mode** if `PUBLIC_BASE_URL` is localhost (good for testing)
- Use **webhook mode** if `PUBLIC_BASE_URL` is a public URL (production)

## 📱 Bot Commands

All commands now work:
- `/start` - Shows "Play Game" button
- `/help` - Lists all commands
- `/wallet <address>` - Save Solana wallet for prizes
- `/leaderboard` - View top 10 players with wallets
- `/rules` - Game rules and how to play

## 📧 Weekly Email

- Sends every 7 days automatically
- Includes top 5 players with username and wallet address
- Sent to: jojothedeity@gmail.com
- First email sends immediately on server start (for testing)

## 💾 Leaderboard Storage

- Scores saved in `data/leaderboard.json`
- Persists forever (survives server restarts)
- Includes username, score, wallet, and timestamp

## 🎮 Playing from Telegram

1. User sends `/start` to bot
2. Clicks "🎮 Play Game" button
3. Opens game in browser with `?tg=<telegram_id>` parameter
4. Plays game and saves score
5. Wallet can be set via `/wallet` command or entered in game

## 🔧 Troubleshooting

**Bot commands not working?**
- Make sure `TELEGRAM_BOT_TOKEN` is set correctly
- Check server logs for errors
- Verify bot token is valid in BotFather

**Email not sending?**
- Check `EMAIL_USER` and `EMAIL_PASSWORD` are set
- Verify Gmail App Password is correct
- Check server logs for email errors

**Leaderboard not persisting?**
- Check `data/leaderboard.json` exists
- Verify file permissions allow writing


