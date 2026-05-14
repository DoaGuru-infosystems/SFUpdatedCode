const webpush = require("web-push");
const dotenv = require("dotenv");
dotenv.config();

try {
  // Use .trim() to handle any accidental spaces in .env
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      "mailto:doaguruinfosystems@gmail.com",
      publicKey,
      privateKey
    );
    console.log("✅ Web Push VAPID keys loaded and trimmed successfully.");
  } else {
    console.warn("⚠️ Web Push keys missing in .env - Offline notifications will be disabled.");
  }
} catch (error) {
  console.error("❌ Failed to set VAPID details:", error.message);
}

module.exports = webpush;
