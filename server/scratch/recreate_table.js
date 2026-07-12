const { db } = require("../config/db");

const run = () => {
  const dropSQL1 = "DROP TABLE IF EXISTS `offer_letters`;";
  const dropSQL2 = "DROP TABLE IF EXISTS `internship_offers`;";
  
  const createSQL1 = `
    CREATE TABLE \`offer_letters\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`address\` text COLLATE utf8mb4_general_ci NOT NULL,
      \`phoneNumber\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`email\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`gender\` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`offerReleaseDate\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`joiningDate\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`designation\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`salary\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`probationPeriod\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`noticePeriod\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`confirmationNoticePeriod\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`jobResponsibilities\` text COLLATE utf8mb4_general_ci NOT NULL,
      \`signatory\` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `;

  const createSQL2 = `
    CREATE TABLE \`internship_offers\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`email\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`gender\` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`phoneNumber\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`address\` text COLLATE utf8mb4_general_ci NOT NULL,
      \`position\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`startDate\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`endDate\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`stipend\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`mentorName\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`mentorContact\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`signatory\` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`termsAndConditions\` text COLLATE utf8mb4_general_ci NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `;

  console.log("Dropping tables...");
  db.query(dropSQL1, (err) => {
    if (err) {
      console.error("❌ Error dropping offer_letters:", err);
      process.exit(1);
    }
    db.query(dropSQL2, (err) => {
      if (err) {
        console.error("❌ Error dropping internship_offers:", err);
        process.exit(1);
      }
      console.log("✅ Dropped tables successfully.");

      console.log("Creating offer_letters table...");
      db.query(createSQL1, (err) => {
        if (err) {
          console.error("❌ Error creating offer_letters:", err);
          process.exit(1);
        }
        console.log("✅ Created offer_letters table.");

        console.log("Creating internship_offers table...");
        db.query(createSQL2, (err) => {
          if (err) {
            console.error("❌ Error creating internship_offers:", err);
            process.exit(1);
          }
          console.log("✅ Created internship_offers table.");
          db.end();
          process.exit(0);
        });
      });
    });
  });
};

run();
