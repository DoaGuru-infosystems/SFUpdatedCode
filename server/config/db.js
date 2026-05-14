const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "dilkeris_sf_new",
});

// Connect to the databases
db.connect((err) => {
  if (err) {
    console.error("Error connecting to db1:", err);
  } else {
    console.log("Connected to db1! DB Name:" , db.config.database);
  }
});

module.exports = { db };
