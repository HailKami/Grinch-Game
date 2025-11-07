import nodemailer from "nodemailer";
import { storage } from "./storage";

const EMAIL_TO = "jojothedeity@gmail.com";

// Create transporter (using Gmail as example - you'll need to set up app password)
function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    console.warn("⚠️  EMAIL_USER and EMAIL_PASSWORD not set - email service disabled");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

export async function sendWeeklyLeaderboardEmail() {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("Skipping email - transporter not configured");
    return;
  }

  try {
    const topScores = await storage.getTopScores(5);
    
    if (topScores.length === 0) {
      console.log("No scores to email");
      return;
    }

    let emailBody = "🏆 Weekly Top 5 Players - Grinchy Gifts 🎄\n\n";
    
    topScores.forEach((entry, index) => {
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
      const wallet = (entry as any).wallet || "No wallet provided";
      emailBody += `${medal} ${(entry as any).username || entry.username}\n`;
      emailBody += `   Score: ${entry.score} points\n`;
      emailBody += `   Wallet: ${wallet}\n\n`;
    });

    emailBody += `\nDate: ${new Date().toLocaleDateString()}\n`;
    emailBody += `Total entries: ${topScores.length}`;

    await transporter.sendMail({
      from: `"Grinchy Gifts" <${process.env.EMAIL_USER}>`,
      to: EMAIL_TO,
      subject: "🏆 Weekly Top 5 Players - Grinchy Gifts",
      text: emailBody,
    });

    console.log(`✅ Weekly leaderboard email sent to ${EMAIL_TO}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

// Schedule weekly emails (every 7 days)
export function scheduleWeeklyEmails() {
  // Send immediately on startup (for testing)
  sendWeeklyLeaderboardEmail();

  // Then schedule every 7 days
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  setInterval(() => {
    sendWeeklyLeaderboardEmail();
  }, sevenDays);

  console.log("✅ Weekly email scheduler started (every 7 days)");
}


