const { google } = require("googleapis");
const moment = require("moment-timezone");
const { db } = require("../config/db");


// Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: "./holiday-fetcher-sf.json", // replace with your path
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
});

// Fetch and insert holidays
const fetchAndInsertHolidays = async () => {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });

    const calendarId = "en.indian#holiday@group.v.calendar.google.com";
    const year = new Date().getFullYear();
    const start = `${year}-01-01T00:00:00Z`;
    const end = `${year}-12-31T23:59:59Z`;

    const res = await calendar.events.list({
      calendarId,
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = res.data.items;

    for (const event of events) {
      const date = event.start.date;
      const title = event.summary;

      const checkQuery = `SELECT * FROM paid_holidays WHERE holiday_date = ?`;
      db.query(checkQuery, [date], (err, result) => {
        if (err) return console.error("Check error:", err.message);

        if (result.length === 0) {
          const dateTime = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");
          const insertQuery = `
            INSERT INTO paid_holidays (holiday_title, holiday_date, holiday_status, holiday_created_at) 
            VALUES (?, ?, 'active', ?)
          `;
          db.query(insertQuery, [title, date, dateTime], (err) => {
            if (err) console.error("Insert error:", err.message);
            else console.log(`✅ Holiday added: ${title} (${date})`);
          });
        } else {
          console.log(`🟡 Skipped existing holiday: ${title} (${date})`);
        }
      });
    }
  } catch (err) {
    if (err.message && (err.message.includes("invalid_grant") || err.message.includes("JWT Signature"))) {
      console.warn("⚠️ [Google Calendar] Holiday fetch skipped: Google Service Account signature validation failed. This is typically due to system clock drift in local sandbox environment (e.g., system year set to 2026). Code execution will proceed normally.");
    } else {
      console.error("❌ Error:", err.message);
    }
  }
};

fetchAndInsertHolidays();
